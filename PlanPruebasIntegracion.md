### 4. Plan de Pruebas de Integración

#### Objetivo
Validar la interacción entre módulos, servicios y sistemas integrados de la plataforma ALDA (AI-based Learning & Development Assistant), asegurando que los componentes se comunican correctamente entre sí y que los flujos de datos entre el Frontend (React/Vite), Backend (FastAPI), Base de Datos (PostgreSQL), Base de Datos Vectorial (ChromaDB) y servicios externos (Google GenAI, API de verificación universitaria) funcionan de manera cohesiva.

---

## Integración 1 — Autenticación: Frontend ↔ API ↔ BD ↔ API Externa

### CU-01 / CU-02 — Iniciar sesión y validar dominio institucional

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-001 | Frontend envía token de Google OAuth → Router `/auth/login` recibe `UserLoginRequest` → `AuthService.validate_email_eligibility()` verifica dominio → API externa valida carrera → `AuthService.register_user()` crea registro en PostgreSQL → Retorna usuario serializado al Frontend | CU-01, CU-02 | Configurar OAuth de Google con client_id válido. API externa `api.sparkingcraft.com` debe estar activa | Frontend React + Backend FastAPI + PostgreSQL + API externa de verificación universitaria | Frontend recibe JSON con `id`, `email`, `name`, `role=student`, `is_active=true` y redirige al dashboard del estudiante |
| I-002 | Frontend envía login con correo de lista blanca (`allowed_emails`) → Router `/auth/login` → `AuthService` detecta correo en whitelist → Omite verificación de carrera → Crea o actualiza usuario en PostgreSQL → Retorna datos al Frontend | CU-01, CU-02, CU-23 | Insertar previamente el correo en la tabla `allowed_emails` | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe usuario autenticado sin pasar por API externa. Se actualiza `last_login` en la BD |
| I-003 | Frontend envía login con usuario existente → Router `/auth/login` → `AuthService.get_user_by_email()` consulta PostgreSQL → `AuthService.login_user()` actualiza `last_login` y `avatar_url` → Retorna usuario actualizado | CU-01 | Usuario debe existir previamente en la BD | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe datos actualizados del usuario con `last_login` renovado |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-004 | Frontend envía login con correo `@gmail.com` no autorizado → Router `/auth/login` → `AuthService` rechaza por dominio no institucional ni en whitelist | CU-01, CU-02 | No incluir el correo en `allowed_emails` | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 403 con mensaje "Solo correos institucionales o autorizados están permitidos." y muestra alerta al usuario |
| I-005 | Frontend envía login con correo institucional → API externa de verificación universitaria retorna timeout (URLError) | CU-01, CU-02 | Simular caída del servicio `api.sparkingcraft.com` o configurar timeout en red | Frontend React + Backend FastAPI + API externa (caída) | Frontend recibe HTTP 503 con mensaje "El servicio de verificación de la universidad está temporalmente inactivo." |
| I-006 | Frontend envía login con correo institucional → API externa retorna 404 (estudiante no encontrado en Ing. de Sistemas) | CU-01, CU-02 | Usar nombre que no figure en registros de Ingeniería de Sistemas | Frontend React + Backend FastAPI + API externa activa | Frontend recibe HTTP 403 con mensaje "No tienes acceso: No figuras como estudiante de Ingeniería de Sistemas." |
| I-007 | Frontend envía login → Usuario existe en BD pero está suspendido (`is_active=false`) → `AuthService.check_user_active()` rechaza | CU-01, CU-22 | Suspender previamente al usuario desde el panel de administrador | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 403 con detalle "BANNED_USER" y muestra pantalla de cuenta suspendida |

---

## Integración 2 — Estudiante: Frontend ↔ API ↔ BD

### CU-03 — Dashboard del estudiante

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-008 | Frontend solicita GET `/student/dashboard` con header `X-User-ID` → Router `/student` invoca `StudentService.get_dashboard()` → Consulta tablas `users`, `attempts`, `laboratories` en PostgreSQL → Calcula métricas → Retorna JSON al Frontend | CU-03, CU-01 | Estudiante debe haber iniciado sesión previamente y tener intentos registrados | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza panel con `available_labs`, `practice_hours`, `ai_hints_used`, `total_attempts` y `latest_lab` |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-009 | Frontend solicita dashboard con `X-User-ID` de usuario inexistente → `StudentService` lanza HTTP 404 | CU-03 | Usar UUID válido pero no existente en BD | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra mensaje de error "Usuario no encontrado" |

---

### CU-04 — Catálogo de retos

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-010 | Frontend solicita GET `/student/labs` → Router invoca `StudentService.get_all_labs()` → Consulta `laboratories` JOIN `test_cases` JOIN `users` → Filtra test_cases ocultos → Retorna lista al Frontend | CU-04, CU-13 | Deben existir laboratorios creados por docentes con casos de prueba (algunos ocultos) | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza catálogo con tarjetas mostrando título, descripción, dificultad, nombre del docente y solo los casos de prueba visibles |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-011 | Frontend solicita catálogo pero PostgreSQL no está disponible → Error de conexión en SQLAlchemy | CU-04 | Detener servicio de PostgreSQL | Frontend React + Backend FastAPI + PostgreSQL (caído) | Frontend recibe HTTP 500 y muestra mensaje genérico de error de servidor |

---

### CU-05 / CU-06 — Editor de código y evaluación con casos de prueba

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-012 | Frontend envía código C++ desde Monaco Editor → POST `/student/compile` con `CompileRequest` → Router invoca servicio de compilación → Docker sandbox compila y ejecuta → Retorna salida estándar al Frontend | CU-05 | Docker debe estar en ejecución con la imagen del sandbox de compilación | Frontend React (Monaco Editor) + Backend FastAPI + Docker sandbox | Frontend muestra en la consola integrada la salida del programa ejecutado |
| I-013 | Frontend envía código + `laboratory_id` → POST `/student/run-tests` con `RunTestsRequest` → Backend obtiene `test_cases` de PostgreSQL → Ejecuta código en sandbox contra cada caso → Compara salidas → Retorna resultados | CU-05, CU-06, CU-13 | Laboratorio debe existir con casos de prueba definidos. Docker sandbox activo | Frontend React + Backend FastAPI + PostgreSQL + Docker sandbox | Frontend muestra lista de test cases con estado ✅ (pasó) o ❌ (falló) por cada uno |
| I-014 | Frontend envía código Python → Backend detecta `language=python` → Sandbox ejecuta con intérprete Python → Retorna resultado | CU-05 | Docker sandbox debe soportar Python | Frontend React + Backend FastAPI + Docker sandbox | Frontend muestra salida de ejecución Python en la consola |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-015 | Frontend envía código con error de compilación → Sandbox retorna stderr → Backend transmite error al Frontend | CU-05 | Enviar código C++ con errores de sintaxis intencionales | Frontend React + Backend FastAPI + Docker sandbox | Frontend muestra error de compilación en la consola con número de línea y descripción |
| I-016 | Frontend envía código que genera bucle infinito → Sandbox alcanza timeout → Backend retorna error de timeout | CU-05, CU-06 | Enviar código con `while(true){}` | Frontend React + Backend FastAPI + Docker sandbox (timeout) | Frontend muestra mensaje "La ejecución excedió el tiempo límite" en la consola |
| I-017 | Frontend envía `RunTestsRequest` con `laboratory_id` inexistente → Backend no encuentra laboratorio en PostgreSQL | CU-06 | Usar UUID válido pero no existente | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe error HTTP 404 y muestra alerta de laboratorio no encontrado |

---

### CU-07 — Tutor inteligente: Frontend ↔ API ↔ BD ↔ ChromaDB ↔ Google GenAI

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-018 | Frontend envía chat al tutor → POST `/student/assistant` con `AssistantRequest` → `AssistantService` consulta ChromaDB para obtener contexto RAG → Envía prompt + contexto + código a Google GenAI → Recibe respuesta socrática → Registra `Attempt` con `ai_feedback` en PostgreSQL → Retorna respuesta al Frontend | CU-07, CU-17 | ChromaDB debe tener documentos indexados. API key de Gemini configurada en `system_settings`. Laboratorio debe existir si se envía `laboratory_id` | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI API | Frontend muestra respuesta del tutor IA en el chat con formato socrático (preguntas reflexivas). Se registra el intento en el historial |
| I-019 | Frontend envía consulta en modo "Sala de Práctica Libre" (sin `laboratory_id`) → Backend procesa sin contexto de laboratorio → ChromaDB provee contexto general → GenAI responde | CU-07 | No enviar `laboratory_id` en el request. ChromaDB con base de conocimiento general | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI API | Frontend recibe respuesta del tutor. Intento se guarda con `laboratory_id=null` |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-020 | Frontend envía consulta al tutor → API key de Gemini inválida o vacía → Google GenAI rechaza la solicitud | CU-07, CU-24 | Configurar `GEMINI_API_KEY` con valor vacío o inválido en `system_settings` | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI (fallo auth) | Frontend recibe error HTTP 503 y muestra mensaje "El servicio de IA no está disponible temporalmente" |
| I-021 | Frontend envía consulta → ChromaDB no está disponible → `AssistantService` no puede recuperar contexto RAG | CU-07, CU-17 | Detener contenedor de ChromaDB | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB (caído) + Google GenAI | Frontend recibe error o respuesta degradada (sin contexto RAG) |

---

### CU-08 — Calificar respuesta del tutor

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-022 | Frontend envía calificación (👍/👎) → POST `/student/attempts/{id}/rate` con `AttemptRatingRequest` → `StudentService.rate_attempt()` valida ownership → Actualiza `ai_rating` y `ai_rating_comment` en PostgreSQL → Retorna confirmación | CU-08, CU-07 | El estudiante debe tener un intento previo con `ai_feedback` registrado | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra confirmación visual (ícono actualizado a estado calificado). La calificación se persiste en BD |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-023 | Frontend envía calificación con `attempt_id` que no pertenece al estudiante autenticado → `StudentService` verifica ownership con `student_id` → Lanza 404 | CU-08 | Usar `attempt_id` de otro estudiante | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 404 y muestra mensaje "Intento no encontrado" |

---

### CU-09 — Historial de intentos

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-024 | Frontend solicita GET `/student/progress` → `StudentService.get_progress()` consulta `attempts` JOIN `laboratories` en PostgreSQL → Calcula `solved_count` buscando "✅ APROBADO" en `ai_feedback` → Retorna métricas y últimos 10 intentos | CU-09, CU-06, CU-07 | Estudiante debe tener intentos variados: algunos con IA, algunos aprobados, algunos reprobados | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza gráfico de progreso con `total_attempts`, `solved_count`, `independence_rate` y tabla de actividad reciente |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-025 | Frontend solicita progreso de estudiante que no tiene ningún intento → `StudentService` retorna métricas en cero | CU-09, CU-03 | Usar cuenta de estudiante recién creada sin actividad | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra panel vacío con `total_attempts=0`, `solved_count=0` y lista de actividad vacía |

---

### CU-10 — Anuncios del docente (vista estudiante)

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-026 | Frontend solicita GET `/student/announcements` → `StudentService.get_announcements()` consulta tabla `announcements` en PostgreSQL → Retorna últimos 5 anuncios ordenados por fecha | CU-10, CU-15 | Deben existir anuncios publicados por docentes | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra lista de anuncios con título, contenido y fecha de publicación |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-027 | Frontend solicita anuncios cuando no existen publicaciones en la BD | CU-10 | Tabla `announcements` vacía | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra estado vacío con mensaje "No hay anuncios disponibles" |

---

## Integración 3 — Docente: Frontend ↔ API ↔ BD

### CU-11 — Panel de estadísticas de clase

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-028 | Frontend (docente) solicita GET `/teacher/stats` con header `X-User-ID` → `verify_teacher_role()` valida rol → `TeacherService.get_stats()` consulta `users`, `laboratories`, `attempts` → Calcula `independence_rate` → Retorna estadísticas | CU-11, CU-01 | Docente autenticado. Deben existir estudiantes con intentos registrados | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza panel con `total_students`, `total_labs`, `total_attempts`, `independence_rate` y lista de `recent_students` |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-029 | Frontend envía request sin header `X-User-ID` → `verify_teacher_role()` rechaza con 401 | CU-11 | No incluir header de autenticación | Frontend React + Backend FastAPI | Frontend recibe HTTP 401 y redirige a pantalla de login |
| I-030 | Estudiante intenta acceder al endpoint de estadísticas del docente → `verify_teacher_role()` rechaza con 403 | CU-11 | Usar `X-User-ID` de un usuario con `role=student` | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 403 con mensaje "Acceso denegado" |

---

### CU-12 — Análisis de errores frecuentes

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-031 | Frontend solicita GET `/teacher/error-analytics` → `TeacherService.get_error_analytics()` consulta últimos 200 intentos → Clasifica errores por keywords en `ai_feedback` → Agrupa por laboratorio → Identifica top 5 estudiantes con más dificultades → Retorna análisis | CU-12, CU-07, CU-06 | Deben existir intentos con `ai_feedback` conteniendo keywords variados ("puntero", "syntax", "loop", "index") | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza gráficos de barras con `error_patterns`, tabla `per_lab` y lista `top_struggling` |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-032 | Frontend solicita análisis cuando no hay intentos con feedback → Servicio retorna listas vacías | CU-12 | Tabla `attempts` sin registros con `ai_feedback` | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra estado vacío "Sin datos de análisis disponibles" con `total_analyzed=0` |

---

### CU-13 / CU-14 — Crear y eliminar laboratorios

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-033 | Frontend envía formulario de nuevo laboratorio → POST `/teacher/labs` con `LabCreateRequest` → `verify_teacher_role()` valida → `TeacherService.create_lab()` inserta en `laboratories` + `test_cases` en PostgreSQL (transacción atómica con flush/commit) → Retorna ID | CU-13 | Docente autenticado. Completar formulario con título, descripción, dificultad y al menos 1 caso de prueba | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra notificación de éxito y el nuevo laboratorio aparece en la lista del docente |
| I-034 | Frontend envía DELETE `/teacher/labs/{id}` → `verify_teacher_role()` valida → `TeacherService.delete_lab()` verifica pertenencia → Elimina laboratorio con cascade (test_cases, attempts) en PostgreSQL | CU-14 | Laboratorio debe pertenecer al docente autenticado | Frontend React + Backend FastAPI + PostgreSQL | Frontend elimina la tarjeta del laboratorio de la lista y muestra notificación "Laboratorio eliminado" |
| I-035 | Frontend envía PUT `/teacher/labs/{id}` con `LabUpdateRequest` → `TeacherService.update_lab()` reemplaza datos y test cases atómicamente (delete + insert) → Retorna confirmación | CU-13 | Laboratorio existente del docente autenticado | Frontend React + Backend FastAPI + PostgreSQL | Frontend actualiza la vista del laboratorio con los nuevos datos y casos de prueba |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-036 | Docente intenta eliminar laboratorio de otro docente → `TeacherService.delete_lab()` verifica `teacher_id` → Rechaza con 403 | CU-14 | Usar `lab_id` de un laboratorio creado por otro docente | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 403 con mensaje "No tienes permiso para eliminar este laboratorio" |
| I-037 | Frontend envía formulario con datos inválidos (título vacío) → Pydantic rechaza `LabCreateRequest` con error de validación 422 | CU-13 | Enviar body con `title: ""` | Frontend React + Backend FastAPI | Frontend muestra errores de validación en los campos del formulario |

---

### CU-15 / CU-16 — Publicar y eliminar anuncios

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-038 | Frontend envía POST `/teacher/announcements` con `AnnouncementRequest` → `verify_teacher_role()` valida → `TeacherService.create_announcement()` inserta en `announcements` de PostgreSQL → Retorna anuncio creado con ID y timestamp | CU-15 | Docente autenticado con formulario de título y contenido válidos | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra el nuevo anuncio en la lista y los estudiantes lo ven en su vista de anuncios (CU-10) |
| I-039 | Frontend envía DELETE `/teacher/announcements/{id}` → `TeacherService.delete_announcement()` verifica pertenencia (o admin) → Elimina de PostgreSQL | CU-16 | Anuncio debe pertenecer al docente autenticado | Frontend React + Backend FastAPI + PostgreSQL | Frontend elimina el anuncio de la lista y muestra confirmación "Anuncio eliminado" |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-040 | Docente intenta eliminar anuncio de otro docente (no admin) → Filtro por `teacher_id` no encuentra el anuncio → HTTP 404 | CU-16 | Usar `announcement_id` de otro docente | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 404 con mensaje "Anuncio no encontrado" |
| I-041 | Frontend envía anuncio con campos vacíos → Pydantic rechaza `AnnouncementRequest` con error de validación 422 | CU-15 | Enviar body con `title: ""` o `content: ""` | Frontend React + Backend FastAPI | Frontend muestra errores de validación en el formulario |

---

### CU-17 / CU-18 — Material pedagógico (RAG): Frontend ↔ API ↔ BD ↔ ChromaDB

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-042 | Frontend envía texto de conocimiento → POST `/teacher/knowledge` → `KnowledgeService.add_item()` indexa texto en ChromaDB (chunking + embedding) → Guarda metadata en `system_config` de PostgreSQL → Retorna key y cantidad de chunks | CU-17, CU-07 | ChromaDB y Google GenAI (embeddings) deben estar activos. Docente autenticado | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI | Frontend muestra material agregado en la lista con título, fuente "texto" y cantidad de chunks. El tutor IA puede usar este conocimiento |
| I-043 | Frontend envía PDF → POST `/teacher/knowledge/upload` → `KnowledgeService.upload_pdf()` extrae texto con `pdfplumber` → Indexa en ChromaDB → Guarda copia física del PDF en `/uploads/knowledge/` → Inserta metadata en `system_config` | CU-17, CU-07 | PDF con texto extraíble (no escaneado). ChromaDB activo | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Filesystem | Frontend muestra el PDF cargado con título, fuente "pdf", chunks creados y total de caracteres extraídos |
| I-044 | Frontend envía DELETE `/teacher/knowledge/{key}` → `KnowledgeService.delete_item()` elimina vectores de ChromaDB → Elimina registro de `system_config` en PostgreSQL | CU-18, CU-17 | Material debe existir previamente en BD y ChromaDB | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB | Frontend elimina el material de la lista y confirma "Conocimiento eliminado de la BD y del vector store" |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-045 | Frontend sube PDF de imagen escaneada (sin texto extraíble) → `pdfplumber` extrae cadena vacía → Servicio lanza HTTP 422 | CU-17 | Usar PDF escaneado sin OCR | Frontend React + Backend FastAPI | Frontend muestra error "El PDF no contiene texto extraíble (podría ser una imagen escaneada)" |
| I-046 | Frontend sube PDF que excede 100 MB → `KnowledgeService` rechaza con HTTP 413 | CU-17 | Usar archivo PDF mayor a 100 MB | Frontend React + Backend FastAPI | Frontend muestra error indicando el tamaño del archivo y el límite máximo |
| I-047 | Frontend intenta agregar texto pero ChromaDB no está disponible → `chroma_service.add_document()` lanza excepción → Servicio continúa con `chunks=0` y guarda en BD | CU-17 | Detener contenedor de ChromaDB | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB (caído) | Material se guarda en BD con `chunks=0`. Frontend muestra advertencia de indexación parcial |

---

### CU-19 — Reporte de calificaciones (Excel)

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-048 | Frontend solicita GET `/teacher/export/excel` → `verify_teacher_role()` valida → `TeacherService.export_excel_report()` consulta últimos 500 intentos en PostgreSQL → Genera DataFrame con `pandas` → Crea archivo `.xlsx` con `openpyxl` (2 hojas: "Intentos Detallados" y "Por Laboratorio") → Retorna `StreamingResponse` | CU-19, CU-06, CU-07 | Deben existir intentos registrados. Librerías `pandas` y `openpyxl` instaladas | Frontend React + Backend FastAPI + PostgreSQL | Navegador descarga archivo `ALDA_Reporte_YYYY-MM-DD.xlsx` con datos estructurados y columnas auto-dimensionadas |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-049 | Frontend solicita reporte cuando PostgreSQL no está disponible → Error de conexión al consultar intentos | CU-19 | Detener servicio PostgreSQL | Frontend React + Backend FastAPI + PostgreSQL (caído) | Frontend recibe HTTP 500 y muestra error "No se pudo generar el reporte" |

---

## Integración 4 — Administrador: Frontend ↔ API ↔ BD

### CU-20 — Estado general de la plataforma

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-050 | Frontend (admin) solicita GET `/admin/stats` → `verify_admin_role()` valida → `AdminService.get_api_stats()` consulta `users`, `attempts` en PostgreSQL → Calcula `calls_today` con filtro de fecha UTC → Retorna métricas | CU-20, CU-01 | Admin autenticado. Deben existir usuarios e intentos | Frontend React + Backend FastAPI + PostgreSQL | Frontend renderiza dashboard con `total_users`, `total_compile_calls`, `total_assistant_calls`, `calls_today`, `model` y `estimated_tokens` |
| I-051 | Frontend solicita GET `/admin/audit` → `AdminService.get_audit_logs()` consulta últimos 50 intentos + 20 últimos logins → Combina, ordena por timestamp y limita a 50 → Retorna logs | CU-20 | Deben existir intentos y logins recientes | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra tabla de auditoría con tipo (compile/ai/auth), acción, usuario y timestamp |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-052 | Usuario con rol `student` intenta acceder a `/admin/stats` → `verify_admin_role()` rechaza con 403 | CU-20 | Usar `X-User-ID` de un estudiante | Frontend React + Backend FastAPI + PostgreSQL | Frontend recibe HTTP 403 "Acceso denegado: Se requiere rol admin" y redirige al dashboard de estudiante |

---

### CU-21 — Cambiar rol de usuario

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-053 | Frontend envía PUT `/admin/users/{id}/role` con `UserUpdateRoleRequest(role="teacher")` → `verify_admin_role()` valida → `AdminService.update_user_role()` actualiza rol en PostgreSQL → Retorna usuario actualizado | CU-21 | Admin autenticado. Usuario objetivo debe existir | Frontend React + Backend FastAPI + PostgreSQL | Frontend actualiza la etiqueta de rol en la tabla de usuarios. El usuario afectado puede acceder a funcionalidades de docente en su próximo login |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-054 | Frontend envía rol inválido (`"superadmin"`) → `AdminService` rechaza con HTTP 400 "Rol inválido" | CU-21 | Enviar body con valor de rol no permitido | Frontend React + Backend FastAPI | Frontend muestra error de validación "Rol inválido" |
| I-055 | Frontend envía cambio de rol para UUID inexistente → `AdminService` lanza HTTP 404 | CU-21 | Usar UUID válido pero no existente | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra error "Usuario no encontrado" |

---

### CU-22 — Suspender o reactivar usuario

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-056 | Frontend envía PUT `/admin/users/{id}/status` con `UserUpdateStatusRequest(is_active=false)` → `AdminService.update_user_status()` verifica que no sea auto-suspensión → Actualiza en PostgreSQL → Retorna usuario | CU-22, CU-01 | Admin autenticado. Usuario objetivo diferente al admin | Frontend React + Backend FastAPI + PostgreSQL | Frontend actualiza estado visual del usuario a "Suspendido". El usuario suspendido recibe "BANNED_USER" en su próximo intento de login (CU-01 I-007) |
| I-057 | Frontend envía reactivación con `is_active=true` → `AdminService` actualiza en PostgreSQL | CU-22 | Usuario previamente suspendido | Frontend React + Backend FastAPI + PostgreSQL | Frontend actualiza estado visual del usuario a "Activo". El usuario puede iniciar sesión nuevamente |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-058 | Admin intenta suspender su propia cuenta (`user_id == admin_id`) → `AdminService` rechaza con HTTP 400 | CU-22 | Enviar `user_id` igual al `X-User-ID` del admin | Frontend React + Backend FastAPI | Frontend muestra error "No puedes cambiar tu propio estado" |

---

### CU-23 — Lista de correos autorizados

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-059 | Frontend envía POST `/admin/allowed-emails` con `AllowedEmailRequest` → `AdminService.add_allowed_email()` normaliza email a minúsculas → Inserta en `allowed_emails` de PostgreSQL → Retorna confirmación | CU-23, CU-01 | Admin autenticado. Email no debe existir previamente en la whitelist | Frontend React + Backend FastAPI + PostgreSQL | Frontend agrega el correo a la tabla de whitelist. El correo autorizado puede iniciar sesión sin verificación de carrera (I-002) |
| I-060 | Frontend solicita GET `/admin/allowed-emails` → `AdminService.get_allowed_emails()` consulta PostgreSQL → Retorna lista ordenada por `created_at` desc | CU-23 | Admin autenticado | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra tabla con `email`, `note` y `created_at` |
| I-061 | Frontend envía DELETE `/admin/allowed-emails/{email}` → `AdminService.remove_allowed_email()` elimina registro de PostgreSQL | CU-23 | Correo debe existir en la whitelist | Frontend React + Backend FastAPI + PostgreSQL | Frontend elimina el correo de la tabla. El correo ya no puede acceder sin ser institucional |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-062 | Frontend intenta agregar correo que ya existe en la whitelist → `AdminService` rechaza con HTTP 400 "El correo ya está en la lista." | CU-23 | Insertar previamente el correo | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra error de duplicado en el formulario |
| I-063 | Frontend intenta eliminar correo que no está en la whitelist → `AdminService` rechaza con HTTP 404 | CU-23 | Usar email no existente en `allowed_emails` | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra error "Correo no encontrado en la lista" |

---

### CU-24 — Configurar modelo de IA y claves del sistema

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-064 | Frontend solicita GET `/admin/settings` → `AdminService.get_settings()` consulta `system_settings` en PostgreSQL con `get_setting()` → Retorna `gemini_key`, `openai_key`, `active_model` | CU-24 | Admin autenticado. Tabla `system_settings` con valores iniciales | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra formulario con las configuraciones actuales cargadas |
| I-065 | Frontend envía PUT `/admin/settings` con `SystemSettingsUpdate` → `AdminService.update_settings()` hace upsert por cada clave en `system_settings` de PostgreSQL → Retorna confirmación | CU-24, CU-07 | Admin autenticado. Al menos un campo con valor no nulo | Frontend React + Backend FastAPI + PostgreSQL | Frontend muestra notificación "Configuración actualizada". Los cambios en el modelo y API key afectan inmediatamente las consultas al tutor IA (CU-07) |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-066 | Frontend envía configuración con API key de Gemini inválida → Se guarda en BD → La siguiente consulta al tutor (CU-07) falla con error de autenticación de Google GenAI | CU-24, CU-07 | Guardar API key malformada. Luego un estudiante solicita tutoría | Frontend React + Backend FastAPI + PostgreSQL + Google GenAI | La configuración se guarda exitosamente, pero el tutor IA deja de funcionar. El docente/admin debe corregir la key |

---

## Integración 5 — Flujos End-to-End (Intermodulares)

### Flujo completo: Registro → Resolver reto → Tutoría → Calificación

#### Casos de Éxito

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-067 | **Flujo completo del estudiante:** (1) Login con Google OAuth → (2) Consultar dashboard → (3) Explorar catálogo → (4) Seleccionar reto → (5) Escribir código en editor → (6) Ejecutar código → (7) Evaluar con test cases → (8) Solicitar guía al tutor → (9) Calificar respuesta → (10) Consultar historial | CU-01 al CU-09 | Todos los servicios activos. Laboratorio con test cases creado. ChromaDB con documentos | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI + Docker sandbox | Cada paso se completa exitosamente. El progreso se refleja en dashboard e historial. La calificación del tutor se registra |
| I-068 | **Flujo completo del docente:** (1) Login → (2) Consultar estadísticas → (3) Crear laboratorio con test cases → (4) Subir material PDF para IA → (5) Publicar anuncio → (6) Revisar errores frecuentes → (7) Generar reporte Excel | CU-01, CU-11 al CU-19 | Todos los servicios activos. Deben existir intentos de estudiantes para las analíticas | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI | Docente crea reto que aparece en catálogo de estudiantes. Material PDF enriquece respuestas del tutor. Anuncio visible para estudiantes. Reporte Excel se descarga correctamente |
| I-069 | **Flujo completo del administrador:** (1) Login → (2) Consultar estado de plataforma → (3) Cambiar rol de student a teacher → (4) Suspender usuario problemático → (5) Agregar correo a whitelist → (6) Configurar API key de Gemini → (7) Revisar auditoría | CU-01, CU-20 al CU-24 | Todos los servicios activos. Múltiples usuarios existentes | Frontend React + Backend FastAPI + PostgreSQL | Admin gestiona toda la plataforma. Cambios de rol se reflejan inmediatamente. Usuario suspendido no puede acceder. Whitelist permite acceso a correo externo |

#### Casos de Fracaso

| Caso | Descripción | Dependencias con otros casos | Procedimientos Especiales | Ambiente de Integración | Resultado Esperado por Interfaz |
| :--- | :--- | :--- | :--- | :--- | :--- |
| I-070 | **Cascada de fallo:** Admin configura API key inválida (CU-24) → Estudiante solicita tutoría (CU-07) → Google GenAI rechaza → Estudiante no recibe guía → Docente ve 0 consultas con IA en estadísticas (CU-11) | CU-24, CU-07, CU-11 | Configurar API key inválida y ejecutar flujo completo | Frontend React + Backend FastAPI + PostgreSQL + ChromaDB + Google GenAI (auth fail) | El fallo en la configuración impacta directamente la funcionalidad de tutoría y las estadísticas del docente |
| I-071 | **Fallo de infraestructura:** PostgreSQL se cae durante operación → Todas las operaciones CRUD fallan → Frontend muestra errores de servidor consistentes en todos los módulos | CU-01 al CU-24 | Detener PostgreSQL durante operación activa | Frontend React + Backend FastAPI + PostgreSQL (caído) | Frontend muestra error HTTP 500 en todos los endpoints. Ningún dato se persiste ni se consulta |

---

### Resumen General del Plan de Pruebas de Integración

| Integración | Casos de Éxito | Casos de Fracaso | Total |
| :--- | :---: | :---: | :---: |
| 1. Autenticación (Frontend ↔ API ↔ BD ↔ API Externa) | 3 | 4 | 7 |
| 2. Estudiante (Frontend ↔ API ↔ BD ↔ ChromaDB ↔ GenAI) | 12 | 11 | 23 |
| 3. Docente (Frontend ↔ API ↔ BD ↔ ChromaDB) | 13 | 10 | 23 |
| 4. Administrador (Frontend ↔ API ↔ BD) | 10 | 6 | 16 |
| 5. Flujos End-to-End (Intermodulares) | 3 | 2 | 5 |
| **TOTAL** | **41** | **33** | **74** |

---

#### Información requerida por caso
* **Dependencias con otros casos.** Casos de uso relacionados que deben funcionar para que la prueba sea válida.
* **Procedimientos especiales.** Configuraciones previas, datos de prueba, servicios que deben estar activos o inactivos.
* **Ambiente de integración.** Infraestructura completa necesaria (Frontend React, Backend FastAPI, PostgreSQL, ChromaDB, Docker sandbox, Google GenAI API, API externa).
* **Resultado esperado por interfaz.** Comportamiento observable tanto en la respuesta HTTP como en la interfaz visual del usuario.