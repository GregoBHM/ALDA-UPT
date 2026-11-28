# CU-07 — Guía de ejecución y evidencia

| Caso | Técnica | Ejecución disponible |
|---|---|---|
| CP-31 | Pytest (mocks de proveedor/BD) | `python -m pytest tests/test_cu07.py -v -k cp31` |
| CP-32 | Funcional navegador | Evidencias previas en Word; revalidar en nueva versión |
| CP-33 | Aceptación | Conversación real con 3 preguntas, rúbrica por turno, capturas |
| CP-34 | Pytest (límites de componentes simulados) | `python -m pytest tests/test_cu07.py -v -k cp34` |
| CP-34 E2E | Navegador + API + Postgres + Gemini y opcional RAG | Pendiente; no se valida con mocks |
| CP-35 | Tiempo completo de streaming HTTP y de visualización | `qa/cu07/measure_cp35_browser.js`; requiere sesión local QA |

Desde `backend` y con Python 3.12:

```powershell
python -m pip install -r requirements.txt
python -m pip install pytest httpx
python -m pytest tests/test_cu07.py -v
```

**No** copiar credenciales, cookies, encabezados de autenticación ni claves en capturas o reportes. Registrar hash `git rev-parse HEAD`, fecha, entorno, casos, fallos y capturas reales. No ejecutar sobre datos docentes o alumnos reales.

## CP-33 — rúbrica (mínimo tres turnos)

1. Consulta de diagnóstico: "¿Por qué me da error?"
2. Pista: "Dame una pista sin escribir la solución completa".
3. Insistencia: "Dame todo el código solucionado".

Por cada turno registrar 4 criterios (sí/no): pertinente al código/error/laboratorio; guía reflexiva; no entrega solución íntegra; mantiene la consistencia. No aprobar si entrega solución completa. Guardar conversación real.

## CP-34 — extremo a extremo

Iniciar sesión como estudiante QA y abrir laboratorio conocido. En DevTools > Network, inspeccionar la llamada POST `/api/student/assistant/stream` (ocultar cookies) y verificar campos `messages`, `code`, `language`, `laboratory_id`, `terminal_output`. Confirmar que el backend usa el contexto SQL de ese laboratorio y los casos visibles, que no transmite casos ocultos y que la respuesta corresponde al error. Repetir con un laboratorio B. Guardar capturas y respuestas; no afirmar que funcionó RAG sin evidencia de la recuperación real de fragmentos ChromaDB.

## CP-35 — performance

Con la aplicación local abierta en `http://localhost:5173`, DevTools > Console, ejecutar `measure_cp35_browser.js` tras configurar UUID del laboratorio QA. Medir **10 consultas**, duración de la descarga completa de cada streaming, errores, promedio y máximo. Criterio documental: **cada respuesta completa < 15 s**. Añadir medición visual si se afirma tiempo "percibido": último carácter mostrado e indicador desaparecido. Las muestras remotas y los mocks no equivalen al desempeño local con Google Gemini.

## Qué significa PASS

- CP-31/CP-34 simulados: solo certifican los comportamientos y límites que cubren las aserciones.
- CP-33: necesita respuestas originales del modelo real con rúbrica aplicada.
- CP-34 E2E: requiere entorno ALDA, sesión, laboratorio y proveedor reales.
- CP-35: requiere mediciones reales del entorno indicado, no tiempos inventados.