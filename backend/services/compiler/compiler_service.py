import os
import json
import asyncio
import tempfile
import shutil
from fastapi import WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

import models
from services.compiler.strategies import CompilerStrategyFactory

_OUTPUT_LIMIT_BYTES = 5 * 1024 * 1024


def _ai_semantic_judge(actual: str, expected: str, api_key: str) -> bool:
    if not api_key:
        return False
    try:
        from google import genai as _genai
        from google.genai import types as _gtypes
        client = _genai.Client(api_key=api_key, http_options={'api_version': 'v1beta', 'timeout': 10000})
        prompt = (
            f"Eres un evaluador de código. El output esperado es: {expected!r}\n"
            f"El output del estudiante es: {actual!r}\n"
            f"Responde SOLO con la palabra 'true' si son lógicamente equivalentes (mismo valor/resultado, puede haber diferencia en texto extra o formato), "
            f"o 'false' si el resultado es incorrecto. Sin explicación."
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            config=_gtypes.GenerateContentConfig(temperature=0.0)
        )
        return response.text.strip().lower().startswith('true')
    except Exception:
        return False


class CompilerService:

    @staticmethod
    def _make_temp_dir() -> str:
        sandbox_dir = os.getenv("SANDBOX_DIR")
        if sandbox_dir:
            os.makedirs(sandbox_dir, exist_ok=True)
        return tempfile.mkdtemp(dir=sandbox_dir)

    async def _read_stream(self, stream, websocket: WebSocket, msg_type: str, tmpdir: str = "",
                           byte_counter: list = None, limit: int = _OUTPUT_LIMIT_BYTES, proc=None):
        """Read chunks from stream and forward to the websocket.
        Stops and kills the process if the total output exceeds `limit` bytes."""
        while True:
            chunk = await stream.read(1024)
            if not chunk:
                break

            # Track cumulative output size
            if byte_counter is not None:
                byte_counter[0] += len(chunk)
                if byte_counter[0] > limit:
                    if proc and proc.returncode is None:
                        proc.kill()
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "text": "\n✖ Output Limit Exceeded: tu programa generó más de 5MB de salida."
                    }))
                    return

            text = chunk.decode('utf-8', errors='replace')

            docker_keywords = [
                "Pulling fs layer", "Download complete", "Pull complete",
                "Verifying Checksum", "Waiting", "Unable to find image",
                "Status: Downloaded newer image", "Pulling from", "Digest:"
            ]
            if any(kw in text for kw in docker_keywords):
                text = text.replace('\r', '\n')
                lines = text.split('\n')
                filtered_lines = [line for line in lines if not any(kw in line for kw in docker_keywords)]
                text = '\n'.join(filtered_lines)
                if not text.strip():
                    continue

            if tmpdir:
                text = text.replace(tmpdir + os.sep, "").replace(tmpdir + "/", "")
            await websocket.send_text(json.dumps({"type": msg_type, "text": text}))

    async def compile_interactive_ws(self, websocket: WebSocket, db: Session, authenticated_user_id: str):
        await websocket.accept()
        tmpdir = self._make_temp_dir()
        proc = None
        try:
            init_data = await websocket.receive_text()
            req = json.loads(init_data)
            code = req.get("code", "")
            lang = req.get("language", "cpp").lower()
            lab_id = req.get("laboratory_id")
            user_id = authenticated_user_id

            try:
                if user_id and lab_id:
                    student_uuid = UUID(user_id)
                    lab_uuid = UUID(lab_id)
                    prev_attempts = db.query(models.Attempt).filter(
                        models.Attempt.student_id == student_uuid,
                        models.Attempt.laboratory_id == lab_uuid
                    ).count()
                    attempt = models.Attempt(
                        student_id=student_uuid,
                        laboratory_id=lab_uuid,
                        code_snapshot=code,
                        student_intention="Compilación Interactiva (WS)",
                        attempt_number=prev_attempts + 1
                    )
                    db.add(attempt)
                    db.commit()
            except Exception as e:
                print("Error saving WS attempt:", e)

            try:
                strategy = CompilerStrategyFactory.create(lang)
            except ValueError:
                await websocket.send_text(json.dumps({"type": "error", "text": f"Lenguaje no soportado: {lang}"}))
                return

            cmd = strategy.build_run_command(code, tmpdir)

            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=tmpdir,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            byte_counter = [0]
            stdout_task = asyncio.create_task(
                self._read_stream(proc.stdout, websocket, "stdout", tmpdir,
                                  byte_counter=byte_counter, proc=proc)
            )
            stderr_task = asyncio.create_task(
                self._read_stream(proc.stderr, websocket, "error", tmpdir,
                                  byte_counter=byte_counter, proc=proc)
            )

            # Detectar si el código espera input del usuario y mostrar hint
            input_patterns = ["input(", "scanf(", "cin >>", "cin>>", "getline(", "readline(", "Scanner(", "nextInt(", "nextLine(", "next()", "readLine("]
            if any(p in code for p in input_patterns):
                await asyncio.sleep(0.3)  # Dar tiempo a Docker para arrancar
                await websocket.send_text(json.dumps({
                    "type": "system",
                    "text": "⌨ Tu programa espera entrada. Escribe aquí y presiona Enter.\n"
                }))

            async def _write_stdin():
                try:
                    while proc.returncode is None:
                        data = await websocket.receive_text()
                        if data:
                            proc.stdin.write(data.encode('utf-8') + b'\n')
                            await proc.stdin.drain()
                except WebSocketDisconnect:
                    pass
                except Exception:
                    pass

            stdin_task = asyncio.create_task(_write_stdin())

            TIMEOUT = 32  # Slightly above the 28s internal timeout so Docker kills first
            try:
                await asyncio.wait_for(proc.wait(), timeout=TIMEOUT)
            except asyncio.TimeoutError:
                proc.kill()  # Use SIGKILL as a hard backstop
                await websocket.send_text(json.dumps({"type": "error", "text": "\n✖ Tiempo límite de ejecución superado. El proceso fue terminado."}))             

            # Wait for stream readers with a short deadline so gather never hangs
            await asyncio.wait_for(
                asyncio.gather(stdout_task, stderr_task, return_exceptions=True),
                timeout=5
            )
            stdin_task.cancel()

            rc = proc.returncode
            if rc == 0:
                pass
            elif rc in (124, 137):  # 124 = timeout killed, 137 = SIGKILL
                await websocket.send_text(json.dumps({"type": "error", "text": "\n⏱ Tiempo límite de 28s excedido. Tu programa fue detenido automáticamente."}))
            elif rc is not None:
                await websocket.send_text(json.dumps({"type": "system", "text": f"\n[Proceso finalizado con código {rc}]"}))

        except WebSocketDisconnect:
            if proc and proc.returncode is None:
                proc.terminate()
        except Exception as e:
            if proc and proc.returncode is None:
                proc.terminate()
            try:
                await websocket.send_text(json.dumps({"type": "error", "text": f"Error interno: {str(e)}"}))
            except:
                pass
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)
            try:
                await websocket.close()
            except:
                pass

    async def run_test_cases(self, db: Session, user_id: str, code: str, language: str, laboratory_id: str) -> dict:
        try:
            user_uuid = UUID(user_id)
            lab_uuid = UUID(laboratory_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="UUID inválido")

        student = db.query(models.DBUser).filter(models.DBUser.id == user_uuid).first()
        if not student:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
        if not lab:
            raise HTTPException(status_code=404, detail="Laboratorio no encontrado")

        test_cases = db.query(models.TestCase).filter(models.TestCase.laboratory_id == lab_uuid).all()
        if not test_cases:
            return {"error": "no_tests", "message": "Este laboratorio no tiene casos de prueba para evaluar.", "results": [], "all_passed": False}

        # Fetch API key for semantic evaluation
        gemini_key_row = db.query(models.SystemSetting).filter(models.SystemSetting.key == "GEMINI_API_KEY").first()
        gemini_api_key = gemini_key_row.value if gemini_key_row else None

        tmpdir = self._make_temp_dir()
        lang = language.lower()

        try:
            try:
                strategy = CompilerStrategyFactory.create(lang)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Lenguaje no soportado: {lang}")

            compile_cmd = strategy.build_compile_command(code, tmpdir)
            if compile_cmd:
                compile_proc = await asyncio.create_subprocess_exec(
                    *compile_cmd,
                    stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
                )
                try:
                    _, stderr = await asyncio.wait_for(compile_proc.communicate(), timeout=30)
                except asyncio.TimeoutError:
                    compile_proc.kill()
                    return {"error": "compilation", "message": "⏱ Compilación demoró más de 30s. Verifica tu código.", "results": [], "all_passed": False}
                if compile_proc.returncode != 0:
                    raw_err = stderr.decode('utf-8', errors='replace').replace("/app/", "")
                    return {"error": "compilation", "message": raw_err, "results": [], "all_passed": False}

            exe_cmd = strategy.build_exec_command(code, tmpdir)

            async def run_single_test(i, tc):
                try:
                    proc = await asyncio.create_subprocess_exec(
                        *exe_cmd, cwd=tmpdir,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    try:
                        input_bytes = tc.input_data.encode('utf-8') if tc.input_data else b""
                        stdout, stderr = await asyncio.wait_for(
                            proc.communicate(input=input_bytes),
                            timeout=10
                        )
                    except asyncio.TimeoutError:
                        proc.terminate()
                        return {
                            "case_number": i + 1,
                            "passed": False,
                            "is_hidden": tc.is_hidden,
                            "input": None if tc.is_hidden else tc.input_data,
                            "expected": None if tc.is_hidden else tc.expected_output,
                            "actual": "⏱ Tiempo límite excedido (10s)",
                            "error": None,
                        }

                    actual_output = stdout.decode('utf-8', errors='replace').strip()
                    expected_output = tc.expected_output.strip()

                    def _sanitize(s: str) -> str:
                        return "\n".join(line.rstrip() for line in s.replace("\r\n", "\n").replace("\r", "\n").split("\n")).strip()

                    eval_type = getattr(tc, 'evaluation_type', 'exact') or 'exact'

                    if eval_type == 'regex':
                        import re
                        try:
                            passed = bool(re.search(expected_output, actual_output))
                        except re.error:
                            passed = _sanitize(actual_output) == _sanitize(expected_output)
                    elif eval_type == 'ai_semantic':
                        # Try exact first to avoid unnecessary AI calls
                        if _sanitize(actual_output) == _sanitize(expected_output):
                            passed = True
                        else:
                            passed = await asyncio.get_event_loop().run_in_executor(
                                None, _ai_semantic_judge, actual_output, expected_output, gemini_api_key
                            )
                    else:
                        passed = _sanitize(actual_output) == _sanitize(expected_output)

                    return {
                        "case_number": i + 1,
                        "passed": passed,
                        "is_hidden": tc.is_hidden,
                        "input": None if tc.is_hidden else tc.input_data,
                        "expected": None if tc.is_hidden else tc.expected_output,
                        "actual": None if tc.is_hidden else actual_output,
                        "error": stderr.decode('utf-8', errors='replace').strip() if stderr and not passed else None,
                    }
                except Exception as e:
                    return {
                        "case_number": i + 1,
                        "passed": False,
                        "is_hidden": tc.is_hidden,
                        "input": None if tc.is_hidden else tc.input_data,
                        "expected": None if tc.is_hidden else tc.expected_output,
                        "actual": f"Error: {str(e)}",
                        "error": str(e),
                    }

            tasks = [run_single_test(i, tc) for i, tc in enumerate(test_cases)]
            results = await asyncio.gather(*tasks)

            all_passed = all(r["passed"] for r in results)
            passed_count = sum(1 for r in results if r["passed"])
            total_count = len(results)

            try:
                prev_attempts = db.query(models.Attempt).filter(
                    models.Attempt.student_id == user_uuid,
                    models.Attempt.laboratory_id == lab_uuid
                ).count()
                attempt = models.Attempt(
                    student_id=user_uuid,
                    laboratory_id=lab_uuid,
                    code_snapshot=code if all_passed else "",
                    student_intention=f"Evaluación: {passed_count}/{total_count} casos pasados",
                    ai_feedback=f"{'✅ APROBADO' if all_passed else '❌ NO APROBADO'}: {passed_count}/{total_count} casos de prueba superados.",
                    attempt_number=prev_attempts + 1,
                )
                db.add(attempt)
                db.commit()
            except Exception as e:
                print(f"Error saving test attempt: {e}")

            return {
                "error": None,
                "all_passed": all_passed,
                "passed_count": passed_count,
                "total_count": total_count,
                "results": results,
            }

        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)
