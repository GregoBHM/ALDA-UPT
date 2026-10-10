import os
import re
import json
from fastapi import HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from google import genai as _genai
from google.genai import types as _gtypes

import models
import chroma_service
from core.dependencies import get_setting


_GEMINI_MODEL = "gemini-2.5-flash"


def _get_system_prompt():
    prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "system_prompt.txt")
    if os.path.exists(prompt_path):
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return "Eres un tutor socrático de programación."


class AssistantService:

    def _resolve_provider(self, db: Session):
        active_model = get_setting(db, "ACTIVE_MODEL", _GEMINI_MODEL)
        is_openai = active_model.lower().startswith("gpt") or active_model.lower().startswith("o1")

        if is_openai:
            api_key = get_setting(db, "OPENAI_API_KEY")
            provider_name = "OpenAI"
        else:
            api_key = get_setting(db, "GEMINI_API_KEY")
            provider_name = "Google Gemini"

        if not api_key or api_key.strip() == "":
            raise HTTPException(
                status_code=503,
                detail=f"El asistente no está disponible: el motor activo requiere una API Key de {provider_name}. Configúrala en el panel de administrador."
            )

        return active_model, api_key, is_openai

    def _build_contents(self, messages, code, language, terminal_output, lab_context: str = "", attempt_number: int = 0, is_pasted: bool = False):
        contents = []
        for msg in messages[:-1]:
            contents.append({
                "role": "user" if msg.role == "user" else "model",
                "parts": [{"text": msg.text}]
            })

        last_msg = messages[-1].text

        context_prefix = ""
        code_context = ""
        console_context = ""
        frustration_note = ""
        paste_note = ""

        if code and code.strip():
            lang_label = (language or "código").upper()
            code_context = (
                f"[CÓDIGO ACTUAL DEL ESTUDIANTE en {lang_label}]:\n"
                f"```{language or ''}\n{code}\n```\n\n"
            )

        if terminal_output and terminal_output.strip():
            console_context = (
                f"[SALIDA DE LA CONSOLA / ERRORES]:\n"
                f"```\n{terminal_output}\n```\n\n"
            )

        if attempt_number >= 4:
            frustration_note = (
                f"[NOTA DEL SISTEMA — FRUSTRACIÓN]: El estudiante lleva {attempt_number} intentos en este laboratorio. "
                f"Ha pedido ayuda varias veces. SÉ MÁS DIRECTO Y ESPECÍFICO. "
                f"Reduce los rodeos, señala el error exacto de forma empática y clara.\n\n"
            )

        if is_pasted:
            paste_note = (
                "[NOTA DEL SISTEMA — CÓDIGO PEGADO]: El estudiante acaba de pegar un bloque de código externo. "
                "NO corrijas ni evalúes el código directamente. "
                "En cambio, pídele que explique con sus propias palabras qué hace una parte específica del código. "
                "Esto asegura que haya aprendizaje real.\n\n"
            )

        if lab_context:
            context_prefix += lab_context

        if frustration_note:
            context_prefix += frustration_note

        if paste_note:
            context_prefix += paste_note

        if code_context or console_context:
            context_prefix += (
                f"--- CONTEXTO DE EJECUCIÓN ---\n"
                f"{code_context}"
                f"{console_context}"
                f"[PREGUNTA DEL ESTUDIANTE]: "
            )

        full_prompt = context_prefix + last_msg
        contents.append({
            "role": "user",
            "parts": [{"text": full_prompt}]
        })

        return contents, last_msg

    def _get_rag_context(self, last_msg: str, code: str, api_key: str) -> str:
        try:
            search_query = last_msg
            if code and code.strip():
                search_query = f"{last_msg} {code[:200]}"
            rag_results = chroma_service.query_knowledge(search_query, n_results=3, api_key=api_key)
            if rag_results:
                fragments = "\n---\n".join([
                    f"[{r['title']}]: {r['text']}" for r in rag_results
                ])
                return (
                    "\n\n[MATERIAL DE REFERENCIA INSTITUCIONAL — Tienes permiso explícito para usar "
                    "este conocimiento para responder directamente al estudiante si su pregunta es general o "
                    "sobre la institución/plataforma. Si es de código, guíalo socráticamente]:\n"
                    f"{fragments}\n"
                )
        except Exception:
            pass
        return ""

    def _call_openai(self, api_key: str, active_model: str, system_prompt: str, contents: list) -> str:
        import openai
        client = openai.OpenAI(api_key=api_key)
        oa_messages = [{"role": "system", "content": system_prompt}]
        for m in contents:
            role = "assistant" if m["role"] == "model" else "user"
            oa_messages.append({"role": role, "content": m["parts"][0]["text"]})

        response = client.chat.completions.create(
            model=active_model,
            messages=oa_messages,
            temperature=0.7,
            timeout=5.0
        )
        return response.choices[0].message.content.strip()

    def _call_gemini(self, api_key: str, active_model: str, system_prompt: str, contents: list) -> str:
        dynamic_client = _genai.Client(api_key=api_key, http_options={'api_version': 'v1beta', 'timeout': 30000})
        response = dynamic_client.models.generate_content(
            model=active_model,
            contents=contents,
            config=_gtypes.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                response_mime_type="application/json"
            )
        )
        reply_raw = response.text.strip()
        if reply_raw.startswith("```"):
            reply_raw = re.sub(r'^```[a-z]*\n?', '', reply_raw)
            reply_raw = re.sub(r'\n?```$', '', reply_raw.strip())
        return reply_raw

    def _extract_json(self, raw: str) -> dict | None:
        """Intenta extraer un objeto JSON de la respuesta, incluso si viene con texto extra."""
        # Intento 1: parsear directamente
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            pass

        # Intento 2: quitar bloques markdown ```json ... ```
        cleaned = re.sub(r'^```[a-z]*\s*', '', raw.strip())
        cleaned = re.sub(r'\s*```\s*$', '', cleaned.strip())
        try:
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            pass

        # Intento 3: buscar el primer { ... } completo en la respuesta
        brace_start = raw.find('{')
        if brace_start != -1:
            depth = 0
            for i in range(brace_start, len(raw)):
                if raw[i] == '{':
                    depth += 1
                elif raw[i] == '}':
                    depth -= 1
                    if depth == 0:
                        candidate = raw[brace_start:i + 1]
                        try:
                            return json.loads(candidate)
                        except (json.JSONDecodeError, ValueError):
                            break

        return None

    def _get_lab_context(self, db: Session, laboratory_id: str) -> str:
        if not laboratory_id:
            return ""
        try:
            lab_uuid = UUID(laboratory_id)
            lab = db.query(models.Laboratory).filter(models.Laboratory.id == lab_uuid).first()
            if not lab:
                return ""
            test_cases = db.query(models.TestCase).filter(models.TestCase.laboratory_id == lab_uuid).all()
            visible_cases = [tc for tc in test_cases if not tc.is_hidden]
            cases_text = ""
            if visible_cases:
                cases_text = "\n".join([
                    f"  Entrada: {tc.input_data!r} → Salida esperada: {tc.expected_output!r}"
                    for tc in visible_cases
                ])
            return (
                f"[LABORATORIO ACTIVO]:\n"
                f"  Título: {lab.title}\n"
                f"  Descripción: {lab.description or 'Sin descripción'}\n"
                f"  Dificultad: {lab.difficulty or 'medium'}\n"
                + (f"  Casos de prueba visibles:\n{cases_text}\n" if cases_text else "")
                + "\n"
            )
        except Exception:
            return ""

    def ask(self, db: Session, user_id: str, req) -> dict:
        if not req.messages:
            raise HTTPException(status_code=400, detail="Se requiere al menos un mensaje.")

        active_model, api_key, is_openai = self._resolve_provider(db)

        attempt_number = 0
        try:
            if user_id and req.laboratory_id:
                student_uuid = UUID(user_id)
                lab_uuid = UUID(req.laboratory_id)
                attempt_number = db.query(models.Attempt).filter(
                    models.Attempt.student_id == student_uuid,
                    models.Attempt.laboratory_id == lab_uuid
                ).count()
        except Exception:
            pass

        lab_context = self._get_lab_context(db, req.laboratory_id)
        is_pasted = getattr(req, 'is_pasted', False) or False

        contents, last_msg = self._build_contents(
            req.messages, req.code, req.language, req.terminal_output,
            lab_context=lab_context, attempt_number=attempt_number, is_pasted=is_pasted
        )

        rag_context = self._get_rag_context(last_msg, req.code, api_key)
        system_with_rag = _get_system_prompt() + rag_context

        if is_openai:
            try:
                reply = self._call_openai(api_key, active_model, system_with_rag, contents)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error de OpenAI: {str(e)}")
        else:
            try:
                reply = self._call_gemini(api_key, active_model, system_with_rag, contents)
            except Exception as e:
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"Error de Gemini: {str(e)}")

        parsed = self._extract_json(reply)
        if parsed and "text" in parsed:
            ai_text = parsed["text"]
            interaction = parsed.get("interaction", None)
            quick_replies = parsed.get("quick_replies", [])
        else:
            ai_text = re.sub(r'\{[\s\S]*?"text"[\s\S]*?\}', '', reply).strip()
            if not ai_text:
                ai_text = reply
            interaction = None
            quick_replies = []

        saved_attempt_id = None
        try:
            if user_id:
                student_uuid = UUID(user_id)
                lab_uuid = UUID(req.laboratory_id) if req.laboratory_id else None

                q = db.query(models.Attempt).filter(models.Attempt.student_id == student_uuid)
                if lab_uuid:
                    q = q.filter(models.Attempt.laboratory_id == lab_uuid)
                prev_attempts = q.count()

                attempt = models.Attempt(
                    student_id=student_uuid,
                    laboratory_id=lab_uuid,
                    code_snapshot=req.code or "",
                    student_intention=last_msg,
                    ai_feedback=ai_text,
                    attempt_number=prev_attempts + 1
                )
                db.add(attempt)
                db.commit()
                db.refresh(attempt)
                saved_attempt_id = str(attempt.id)
        except Exception as e:
            print("Error saving ai attempt:", e)

        return {
            "reply": ai_text,
            "interaction": interaction,
            "quick_replies": quick_replies,
            "attempt_id": saved_attempt_id,
        }

    def ask_stream(self, db: Session, user_id: str, req):
        if not req.messages:
            raise HTTPException(status_code=400, detail="Se requiere al menos un mensaje.")

        active_model, api_key, is_openai = self._resolve_provider(db)

        attempt_number = 0
        try:
            if user_id and req.laboratory_id:
                student_uuid = UUID(user_id)
                lab_uuid = UUID(req.laboratory_id)
                attempt_number = db.query(models.Attempt).filter(
                    models.Attempt.student_id == student_uuid,
                    models.Attempt.laboratory_id == lab_uuid
                ).count()
        except Exception:
            pass

        lab_context = self._get_lab_context(db, req.laboratory_id)
        is_pasted = getattr(req, 'is_pasted', False) or False

        contents, last_msg = self._build_contents(
            req.messages, req.code, req.language, req.terminal_output,
            lab_context=lab_context, attempt_number=attempt_number, is_pasted=is_pasted
        )

        rag_context = self._get_rag_context(last_msg, req.code, api_key)
        system_with_rag = _get_system_prompt() + rag_context

        full_text = []

        def _generate():
            try:
                stream_client = _genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
                for chunk in stream_client.models.generate_content_stream(
                    model=active_model,
                    contents=contents,
                    config=_gtypes.GenerateContentConfig(
                        system_instruction=system_with_rag,
                        temperature=0.7,
                    )
                ):
                    if chunk.text:
                        full_text.append(chunk.text)
                        yield chunk.text.encode('utf-8')
            except Exception as e:
                yield f"\n[Error: {str(e)}]".encode('utf-8')
            finally:
                ai_text = "".join(full_text)
                try:
                    if user_id and ai_text:
                        s_uuid = UUID(user_id)
                        lab_uuid = UUID(req.laboratory_id) if req.laboratory_id else None
                        q = db.query(models.Attempt).filter(models.Attempt.student_id == s_uuid)
                        if lab_uuid:
                            q = q.filter(models.Attempt.laboratory_id == lab_uuid)
                        prev = q.count()
                        attempt = models.Attempt(
                            student_id=s_uuid,
                            laboratory_id=lab_uuid,
                            code_snapshot=req.code or "",
                            student_intention=last_msg,
                            ai_feedback=ai_text,
                            attempt_number=prev + 1
                        )
                        db.add(attempt)
                        db.commit()
                except Exception:
                    pass

        return _generate()
