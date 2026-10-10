### 3. Plan de Pruebas Unitarias

#### Objetivo
Validar individualmente cada componente, función, clase o procedimiento desarrollado en la plataforma ALDA (AI-based Learning & Development Assistant), garantizando que cada unidad de código cumpla con su comportamiento esperado de forma aislada.

---

## Módulo de Autenticación

### CU-01 — Iniciar sesión con cuenta Google

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-001 | Iniciar sesión con correo institucional `@virtual.upt.pe` válido y nombre registrado en Ing. de Sistemas | Retorna objeto usuario con `id`, `email`, `name`, `role`, `is_active=true` y actualiza `last_login` | `AuthService.login_user()`, `AuthService.validate_email_eligibility()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-002 | Registrar un usuario nuevo con correo institucional válido que no existe en la BD | Crea registro en tabla `users` con `role=student`, retorna objeto usuario con datos completos | `AuthService.register_user()`, `AuthService.validate_email_eligibility()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-003 | Iniciar sesión con correo que está en la lista blanca (`allowed_emails`) pero no es institucional | Retorna `True` en validación y permite el acceso sin verificar carrera | `AuthService.validate_email_eligibility()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-004 | Intentar login con correo no institucional y que no está en la lista blanca | Lanza `HTTPException(403)` con mensaje "Solo correos institucionales o autorizados están permitidos." | `AuthService.validate_email_eligibility()` | Backend FastAPI | Andy Calizaya |
| U-005 | Intentar login con correo institucional pero nombre no corresponde a Ing. de Sistemas (API externa retorna 404) | Lanza `HTTPException(403)` con mensaje "No tienes acceso: No figuras como estudiante de Ingeniería de Sistemas." | `AuthService.validate_email_eligibility()`, API externa de verificación | Backend FastAPI + Mock de API externa | Gregory Huanca |
| U-006 | Servicio externo de verificación universitaria no disponible (URLError) | Lanza `HTTPException(503)` con mensaje "El servicio de verificación de la universidad está temporalmente inactivo." | `AuthService.validate_email_eligibility()`, API externa | Backend FastAPI + Mock de API externa | Andy Calizaya |

---

### CU-02 — Validar acceso por dominio institucional

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-007 | Validar correo con dominio `@virtual.upt.pe` en minúsculas | `validate_email_eligibility()` retorna `True` | `AuthService`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-008 | Validar correo con dominio institucional en mayúsculas (`@VIRTUAL.UPT.PE`) | El email se normaliza a minúsculas y la validación retorna `True` | `AuthService.validate_email_eligibility()` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-009 | Validar correo con dominio `@gmail.com` sin estar en lista blanca | Lanza `HTTPException(403)` | `AuthService.validate_email_eligibility()` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-010 | Intentar acceder con usuario existente pero con `is_active=false` (suspendido) | `check_user_active()` lanza `HTTPException(403)` con detalle "BANNED_USER" | `AuthService.check_user_active()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |

---

## Módulo de Estudiante

### CU-03 — Consultar panel de progreso personal

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-011 | Consultar dashboard con email de estudiante que tiene intentos registrados | Retorna JSON con `available_labs`, `practice_hours > 0`, `ai_hints_used`, `total_attempts > 0` y `latest_lab` con título y dificultad | `StudentService.get_dashboard()`, tablas `users`, `attempts`, `laboratories` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-012 | Consultar dashboard de estudiante sin intentos registrados | Retorna JSON con `practice_hours=0`, `ai_hints_used=0`, `total_attempts=0`, `latest_lab=null` | `StudentService.get_dashboard()`, tablas `users`, `laboratories` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-013 | Consultar dashboard con email que no existe en la BD | Lanza `HTTPException(404)` con mensaje "Usuario no encontrado" | `StudentService.get_dashboard()` | Backend FastAPI + PostgreSQL | Andy Calizaya |

---

### CU-04 — Explorar catálogo de retos disponibles

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-014 | Obtener lista de laboratorios cuando existen múltiples retos en la BD | Retorna lista ordenada por `created_at` desc, cada elemento contiene `id`, `title`, `description`, `difficulty`, `is_exam`, `teacher_name`, `test_cases` (solo los no ocultos) y `total_test_cases` | `StudentService.get_all_labs()`, tablas `laboratories`, `test_cases`, `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-015 | Obtener catálogo cuando no hay laboratorios creados | Retorna lista vacía `[]` | `StudentService.get_all_labs()`, tabla `laboratories` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-016 | Verificar que los casos de prueba ocultos (`is_hidden=true`) no se muestran al estudiante | Lista de `test_cases` del laboratorio solo incluye los que tienen `is_hidden=false` | `StudentService.get_all_labs()`, tabla `test_cases` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-017 | Error de conexión a la base de datos al consultar laboratorios | Lanza excepción de conexión (`OperationalError`) | `StudentService.get_all_labs()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Andy Calizaya |

---

### CU-05 — Escribir y ejecutar código en el editor

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-018 | Enviar código válido en C++ para compilación y ejecución | Retorna salida de la ejecución exitosa con el resultado del programa | `CompileRequest` schema, servicio de compilación, sandbox Docker | Backend FastAPI + Docker sandbox | Andy Calizaya |
| U-019 | Enviar código válido en Python para compilación y ejecución | Retorna salida correcta de la ejecución del script Python | `CompileRequest` schema (language=`python`), servicio de compilación | Backend FastAPI + Docker sandbox | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-020 | Enviar código con errores de sintaxis en C++ | Retorna mensaje de error de compilación con detalles del error | `CompileRequest` schema, servicio de compilación | Backend FastAPI + Docker sandbox | Andy Calizaya |
| U-021 | Enviar código con campo `code` vacío | Lanza error de validación del schema `CompileRequest` (campo requerido) | `CompileRequest` schema (Pydantic) | Backend FastAPI | Gregory Huanca |
| U-022 | Enviar código con lenguaje no soportado (por ejemplo `ruby`) | Retorna error indicando que el lenguaje no es soportado | `CompileRequest` schema, servicio de compilación | Backend FastAPI + Docker sandbox | Andy Calizaya |

---

### CU-06 — Evaluar código con casos de prueba

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-023 | Enviar código que pasa todos los casos de prueba de un laboratorio (evaluación `exact`) | Retorna resultado con todos los test cases marcados como aprobados | `RunTestsRequest` schema, tablas `laboratories`, `test_cases`, servicio de compilación | Backend FastAPI + PostgreSQL + Docker sandbox | Gregory Huanca |
| U-024 | Enviar código que pasa parcialmente los casos de prueba | Retorna resultado indicando cuáles test cases pasaron y cuáles fallaron | `RunTestsRequest` schema, servicio de compilación, tabla `test_cases` | Backend FastAPI + PostgreSQL + Docker sandbox | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-025 | Enviar código para evaluación con `laboratory_id` inexistente | Lanza `HTTPException(404)` o error de laboratorio no encontrado | `RunTestsRequest` schema, tabla `laboratories` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-026 | Enviar código que genera un timeout (bucle infinito) durante la evaluación | Retorna error de timeout indicando que la ejecución excedió el tiempo límite | `RunTestsRequest` schema, servicio de compilación | Backend FastAPI + Docker sandbox | Andy Calizaya |

---

### CU-07 — Solicitar guía al tutor inteligente

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-027 | Enviar consulta al asistente con mensajes válidos, código y contexto de laboratorio | Retorna respuesta socrática generada por la IA, se registra un `Attempt` con `ai_feedback` | `AssistantRequest` schema, `AssistantService`, ChromaDB, Google GenAI, tabla `attempts` | Backend FastAPI + PostgreSQL + ChromaDB + API Google GenAI | Andy Calizaya |
| U-028 | Enviar consulta al asistente sin `laboratory_id` (modo sala de práctica libre) | Retorna respuesta del asistente, se registra intento con `laboratory_id=null` | `AssistantRequest` schema, `AssistantService` | Backend FastAPI + PostgreSQL + ChromaDB + API Google GenAI | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-029 | Enviar consulta al asistente con lista de mensajes vacía | Lanza error de validación del schema `AssistantRequest` | `AssistantRequest` schema (Pydantic) | Backend FastAPI | Andy Calizaya |
| U-030 | Solicitar guía cuando la API de Google GenAI no está disponible o la key es inválida | Lanza `HTTPException(503)` o error indicando fallo del servicio de IA | `AssistantService`, configuración de API keys | Backend FastAPI + PostgreSQL | Gregory Huanca |

---

### CU-08 — Calificar respuesta del tutor de IA

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-031 | Calificar un intento con `rating=1` (útil) y un comentario | Actualiza `ai_rating=1` y `ai_rating_comment` en el intento. Retorna `{"detail": "Calificación registrada.", "rating": 1}` | `StudentService.rate_attempt()`, tabla `attempts` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-032 | Calificar un intento con `rating=-1` (no útil) sin comentario | Actualiza `ai_rating=-1` y `ai_rating_comment=null`. Retorna `{"detail": "Calificación registrada.", "rating": -1}` | `StudentService.rate_attempt()`, tabla `attempts` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-033 | Calificar con `rating=5` (valor fuera de rango, solo se permite 1 o -1) | Lanza `HTTPException(400)` con mensaje "El rating debe ser 1 (útil) o -1 (no útil)." | `StudentService.rate_attempt()` | Backend FastAPI | Gregory Huanca |
| U-034 | Calificar un intento con `attempt_id` que no pertenece al estudiante actual | Lanza `HTTPException(404)` con mensaje "Intento no encontrado." | `StudentService.rate_attempt()`, tabla `attempts` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-035 | Calificar con `attempt_id` con formato UUID inválido | Lanza `HTTPException(400)` con mensaje "ID inválido." | `StudentService.rate_attempt()` | Backend FastAPI | Gregory Huanca |

---

### CU-09 — Consultar historial de intentos

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-036 | Consultar progreso de un estudiante con múltiples intentos | Retorna JSON con `total_attempts`, `attempts_with_ai`, `independent_attempts`, `solved_count`, `total_labs` y `recent_activity` (máx. 10 últimos) | `StudentService.get_progress()`, tablas `users`, `attempts`, `laboratories` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-037 | Consultar progreso de estudiante que tiene intentos con "✅ APROBADO" en el feedback | El campo `solved_count` contabiliza correctamente los laboratorios únicos aprobados, `is_passed=true` en la actividad reciente | `StudentService.get_progress()`, tablas `attempts`, `laboratories` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-038 | Consultar progreso con email inexistente en la BD | Lanza `HTTPException(404)` con mensaje "Usuario no encontrado" | `StudentService.get_progress()` | Backend FastAPI + PostgreSQL | Andy Calizaya |

---

### CU-10 — Visualizar anuncios del docente

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-039 | Obtener anuncios cuando existen publicaciones activas | Retorna lista de hasta 5 anuncios ordenados por `created_at` desc, con `id`, `title`, `content` y `created_at` | `StudentService.get_announcements()`, tabla `announcements` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-040 | Obtener anuncios cuando no hay publicaciones | Retorna lista vacía `[]` | `StudentService.get_announcements()`, tabla `announcements` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-041 | Error de conexión a la BD al consultar anuncios | Lanza excepción de conexión (`OperationalError`) | `StudentService.get_announcements()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Gregory Huanca |

---

## Módulo de Docente

### CU-11 — Consultar panel de estadísticas de clase

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-042 | Consultar estadísticas con datos de estudiantes, laboratorios e intentos | Retorna JSON con `total_students`, `total_labs`, `total_attempts`, `total_with_ai`, `independence_rate` calculada correctamente, y `recent_students` (máx. 5) | `TeacherService.get_stats()`, tablas `users`, `laboratories`, `attempts` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-043 | Consultar estadísticas cuando no hay intentos registrados | `total_attempts=0`, `independence_rate=100.0` (sin divisiones por cero) | `TeacherService.get_stats()` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-044 | Error de conexión a la base de datos al obtener estadísticas | Lanza excepción de conexión (`OperationalError`) | `TeacherService.get_stats()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Andy Calizaya |

---

### CU-12 — Revisar análisis de errores frecuentes

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-045 | Obtener análisis de errores con intentos que contienen feedback con keywords de "puntero", "syntax", "loop" | Retorna `error_patterns` con categorías ("Errores de punteros/memoria", "Errores de sintaxis", "Bucles infinitos/lógica") y conteos correctos | `TeacherService.get_error_analytics()`, tabla `attempts` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-046 | Obtener análisis cuando no hay intentos con feedback | Retorna `per_lab=[]`, `error_patterns=[]`, `top_struggling=[]`, `total_analyzed=0` | `TeacherService.get_error_analytics()`, tabla `attempts` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-047 | Verificar que `top_struggling` retorna máximo 5 estudiantes ordenados por cantidad de solicitudes de IA | La lista `top_struggling` tiene máximo 5 elementos, ordenados de mayor a menor `ai_requests` | `TeacherService.get_error_analytics()`, tablas `attempts`, `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-048 | Intentos con feedback que no contiene palabras clave reconocidas | Se clasifican bajo la categoría "Otros errores" | `TeacherService.get_error_analytics()` | Backend FastAPI + PostgreSQL | Andy Calizaya |

---

### CU-13 — Crear laboratorio con casos de prueba

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-049 | Crear laboratorio con título, descripción, dificultad `medium` y 3 casos de prueba (1 oculto) | Retorna `{"message": "Reto y casos de prueba creados", "id": "<UUID>"}`. Se crea registro en `laboratories` y 3 en `test_cases` | `TeacherService.create_lab()`, `LabCreateRequest` schema, tablas `laboratories`, `test_cases` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-050 | Crear laboratorio marcado como examen (`is_exam=true`) sin casos de prueba | Se crea el laboratorio exitosamente con `is_exam=true` y lista de test_cases vacía | `TeacherService.create_lab()`, `LabCreateRequest` schema | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-051 | Crear laboratorio con campo `title` vacío | Lanza error de validación Pydantic (campo requerido no puede ser vacío) | `LabCreateRequest` schema | Backend FastAPI | Andy Calizaya |
| U-052 | Crear laboratorio con caso de prueba que tiene `input_data` vacío | Lanza error de validación Pydantic en `TestCaseCreateRequest` | `TestCaseCreateRequest` schema | Backend FastAPI | Gregory Huanca |

---

### CU-14 — Eliminar laboratorio propio

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-053 | Eliminar laboratorio creado por el docente autenticado | Retorna `{"message": "Laboratorio eliminado"}`. Se eliminan registros en cascada de `test_cases` y `attempts` | `TeacherService.delete_lab()`, tablas `laboratories`, `test_cases`, `attempts` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-054 | Administrador elimina laboratorio de otro docente (`is_admin=true`) | Eliminación exitosa sin restricción de pertenencia | `TeacherService.delete_lab()`, tablas `laboratories` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-055 | Docente intenta eliminar laboratorio creado por otro docente | Lanza `HTTPException(403)` con mensaje "No tienes permiso para eliminar este laboratorio" | `TeacherService.delete_lab()` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-056 | Eliminar laboratorio con UUID inexistente | Lanza `HTTPException(404)` con mensaje "Laboratorio no encontrado" | `TeacherService.delete_lab()` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-057 | Eliminar laboratorio con `lab_id` en formato inválido (no UUID) | Lanza `HTTPException(400)` con mensaje "ID inválido" | `TeacherService.delete_lab()` | Backend FastAPI | Gregory Huanca |

---

### CU-15 — Publicar anuncio académico

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-058 | Crear anuncio con título y contenido válidos | Retorna JSON con `id`, `title`, `content` y `created_at`. Se crea registro en tabla `announcements` | `TeacherService.create_announcement()`, `AnnouncementRequest` schema, tabla `announcements` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-059 | Crear anuncio con campo `title` vacío | Lanza error de validación Pydantic (campo requerido) | `AnnouncementRequest` schema | Backend FastAPI | Gregory Huanca |
| U-060 | Crear anuncio con campo `content` vacío | Lanza error de validación Pydantic (campo requerido) | `AnnouncementRequest` schema | Backend FastAPI | Andy Calizaya |

---

### CU-16 — Eliminar anuncio propio

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-061 | Docente elimina su propio anuncio con ID válido | Retorna `{"detail": "Anuncio eliminado."}`. Registro eliminado de la tabla `announcements` | `TeacherService.delete_announcement()`, tabla `announcements` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-062 | Administrador elimina anuncio de cualquier docente (`is_admin=true`) | Eliminación exitosa sin restricción de pertenencia | `TeacherService.delete_announcement()`, tabla `announcements` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-063 | Docente intenta eliminar anuncio de otro docente | Lanza `HTTPException(404)` con mensaje "Anuncio no encontrado." (filtro por `teacher_id`) | `TeacherService.delete_announcement()` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-064 | Eliminar anuncio con UUID inexistente | Lanza `HTTPException(404)` con mensaje "Anuncio no encontrado." | `TeacherService.delete_announcement()` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-065 | Eliminar anuncio con `announcement_id` en formato inválido | Lanza `HTTPException(400)` con mensaje "ID inválido." | `TeacherService.delete_announcement()` | Backend FastAPI | Gregory Huanca |

---

### CU-17 — Cargar material pedagógico para la IA

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-066 | Agregar material de texto con título y contenido válidos | Retorna `{"message": "Conocimiento guardado exitosamente", "key": "<key>", "chunks_created": N}`. Se indexa en ChromaDB y se guarda en `system_config` | `KnowledgeService.add_item()`, ChromaDB, tabla `system_config` | Backend FastAPI + PostgreSQL + ChromaDB | Andy Calizaya |
| U-067 | Subir archivo PDF válido con texto extraíble | Retorna JSON con `message`, `key`, `filename`, `chunks_created` y `total_chars`. PDF se guarda en disco y el texto se indexa en ChromaDB | `KnowledgeService.upload_pdf()`, `pdfplumber`, ChromaDB, tabla `system_config` | Backend FastAPI + PostgreSQL + ChromaDB | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-068 | Subir PDF que excede el límite de 100 MB | Lanza `HTTPException(413)` con mensaje indicando el tamaño y el límite | `KnowledgeService.upload_pdf()` | Backend FastAPI | Andy Calizaya |
| U-069 | Subir PDF que es una imagen escaneada (sin texto extraíble) | Lanza `HTTPException(422)` con mensaje "El PDF no contiene texto extraíble (podría ser una imagen escaneada)" | `KnowledgeService.upload_pdf()`, `pdfplumber` | Backend FastAPI | Gregory Huanca |
| U-070 | Subir archivo PDF corrupto o con formato inválido | Lanza `HTTPException(422)` con mensaje "Error leyendo el PDF con pdfplumber: ..." | `KnowledgeService.upload_pdf()`, `pdfplumber` | Backend FastAPI | Andy Calizaya |

---

### CU-18 — Eliminar material de la base de conocimiento

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-071 | Eliminar material existente con clave válida | Retorna `{"message": "Conocimiento eliminado de la BD y del vector store"}`. Se elimina de ChromaDB y de la tabla `system_config` | `KnowledgeService.delete_item()`, ChromaDB, tabla `system_config` | Backend FastAPI + PostgreSQL + ChromaDB | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-072 | Eliminar material con clave inexistente en la BD | Lanza `HTTPException(404)` con mensaje "Ítem no encontrado" | `KnowledgeService.delete_item()`, tabla `system_config` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-073 | Eliminar material cuando ChromaDB no está disponible pero la clave existe en BD | Se ignora el error de ChromaDB y se elimina correctamente de la BD. Retorna éxito | `KnowledgeService.delete_item()`, ChromaDB (caído), tabla `system_config` | Backend FastAPI + PostgreSQL | Gregory Huanca |

---

### CU-19 — Generar reporte de calificaciones (PDF y Excel)

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-074 | Generar reporte Excel con intentos registrados en la BD | Retorna `StreamingResponse` con archivo `.xlsx` que contiene hojas "Intentos Detallados" y "Por Laboratorio" con datos correctos | `TeacherService.export_excel_report()`, `pandas`, `openpyxl`, tablas `attempts`, `users`, `laboratories` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-075 | Generar reporte Excel cuando no hay intentos registrados | Retorna archivo `.xlsx` con hojas vacías pero con encabezados de columnas correctos | `TeacherService.export_excel_report()`, `pandas`, `openpyxl` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-076 | Error de conexión a la BD al generar el reporte | Lanza excepción de conexión (`OperationalError`) | `TeacherService.export_excel_report()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Andy Calizaya |

---

## Módulo de Administrador

### CU-20 — Consultar estado general de la plataforma

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-077 | Consultar estadísticas generales de la plataforma con datos existentes | Retorna JSON con `total_users`, `total_compile_calls`, `total_assistant_calls`, `calls_today`, `model`, `estimated_tokens` (calculado como `total_with_ai * 800`) | `AdminService.get_api_stats()`, tablas `users`, `attempts` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-078 | Consultar auditoría con actividad reciente (intentos y logins) | Retorna lista de hasta 50 logs combinados (compilaciones, consultas IA, logins) ordenados por timestamp desc | `AdminService.get_audit_logs()`, tablas `attempts`, `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-079 | Error de conexión a la BD al consultar estadísticas de la plataforma | Lanza excepción de conexión (`OperationalError`) | `AdminService.get_api_stats()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Gregory Huanca |

---

### CU-21 — Cambiar rol de un usuario

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-080 | Cambiar rol de un usuario de `student` a `teacher` con UUID válido | Retorna objeto usuario actualizado con `role=teacher`. Se persiste el cambio en la BD | `AdminService.update_user_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-081 | Cambiar rol de un usuario de `teacher` a `admin` | Retorna objeto usuario actualizado con `role=admin` | `AdminService.update_user_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-082 | Cambiar rol con un valor inválido (por ejemplo `superadmin`) | Lanza `HTTPException(400)` con mensaje "Rol inválido" | `AdminService.update_user_role()` | Backend FastAPI | Andy Calizaya |
| U-083 | Cambiar rol de un usuario con UUID inexistente | Lanza `HTTPException(404)` con mensaje "Usuario no encontrado" | `AdminService.update_user_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-084 | Cambiar rol con `user_id` en formato UUID inválido | Lanza `HTTPException(400)` con mensaje "UUID inválido" | `AdminService.update_user_role()` | Backend FastAPI | Andy Calizaya |

---

### CU-22 — Suspender o reactivar acceso de un usuario

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-085 | Suspender usuario activo (`is_active=false`) con UUID válido | Retorna usuario con `is_active=false`. Se persiste el cambio en la BD | `AdminService.update_user_status()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-086 | Reactivar usuario suspendido (`is_active=true`) | Retorna usuario con `is_active=true`. Se persiste el cambio en la BD | `AdminService.update_user_status()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-087 | Administrador intenta cambiar su propio estado (`user_id == admin_id`) | Lanza `HTTPException(400)` con mensaje "No puedes cambiar tu propio estado" | `AdminService.update_user_status()` | Backend FastAPI | Gregory Huanca |
| U-088 | Suspender usuario con UUID inexistente | Lanza `HTTPException(404)` con mensaje "Usuario no encontrado" | `AdminService.update_user_status()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-089 | Suspender usuario con formato de UUID inválido | Lanza `HTTPException(400)` con mensaje "UUID inválido" | `AdminService.update_user_status()` | Backend FastAPI | Gregory Huanca |

---

### CU-23 — Gestionar lista de correos autorizados

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-090 | Agregar correo válido a la lista blanca con nota descriptiva | Retorna `{"email": "<email_normalizado>", "note": "<nota>"}`. Se crea registro en `allowed_emails` con email en minúsculas | `AdminService.add_allowed_email()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-091 | Obtener lista de correos autorizados ordenados por fecha | Retorna lista con `email`, `note` y `created_at` ordenados por `created_at` desc | `AdminService.get_allowed_emails()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-092 | Eliminar correo existente de la lista blanca | Retorna `{"detail": "Correo eliminado correctamente."}`. Se elimina registro de `allowed_emails` | `AdminService.remove_allowed_email()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-093 | Agregar correo que ya existe en la lista blanca | Lanza `HTTPException(400)` con mensaje "El correo ya está en la lista." | `AdminService.add_allowed_email()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-094 | Eliminar correo que no está en la lista blanca | Lanza `HTTPException(404)` con mensaje "Correo no encontrado en la lista." | `AdminService.remove_allowed_email()`, tabla `allowed_emails` | Backend FastAPI + PostgreSQL | Andy Calizaya |

---

### CU-24 — Configurar modelo de IA y claves del sistema

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-095 | Obtener configuraciones actuales del sistema (API keys y modelo activo) | Retorna JSON con `gemini_key`, `openai_key` y `active_model` | `AdminService.get_settings()`, `get_setting()`, tabla `system_settings` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-096 | Actualizar la clave de Gemini API y el modelo activo | Retorna `{"message": "Configuración actualizada"}`. Se hace upsert en la tabla `system_settings` | `AdminService.update_settings()`, tabla `system_settings` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-097 | Actualizar solo un campo (por ejemplo, solo `active_model`), dejando los demás como `null` | Solo se actualiza el campo proporcionado, los campos `null` se ignoran sin modificar valores existentes | `AdminService.update_settings()`, tabla `system_settings` | Backend FastAPI + PostgreSQL | Gregory Huanca |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-098 | Error de conexión a la BD al intentar guardar configuraciones | Lanza excepción de conexión (`OperationalError`) y no se persisten los cambios | `AdminService.update_settings()`, conexión PostgreSQL | Backend FastAPI + PostgreSQL (servicio caído) | Andy Calizaya |

---

## Pruebas Transversales — Middleware y Dependencias

### Verificación de Roles (core/dependencies.py)

#### Casos de Éxito

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-099 | Enviar header `X-User-ID` con UUID de usuario admin en endpoint protegido | `verify_admin_role()` retorna el objeto usuario correctamente | `verify_admin_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-100 | Enviar header `X-User-ID` con UUID de usuario teacher en endpoint que requiere teacher | `verify_teacher_role()` retorna el objeto usuario correctamente | `verify_teacher_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |

#### Casos de Fracaso

| Caso | Descripción | Resultado Esperado | Dependencias | Ambiente Requerido | Responsable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| U-101 | Enviar request sin header `X-User-ID` | Lanza `HTTPException(401)` con mensaje "Header X-User-ID faltante" | `verify_admin_role()` o `verify_teacher_role()` | Backend FastAPI | Gregory Huanca |
| U-102 | Enviar header `X-User-ID` con formato de UUID inválido | Lanza `HTTPException(400)` con mensaje "Formato de UUID inválido" | `verify_admin_role()` o `verify_teacher_role()` | Backend FastAPI | Andy Calizaya |
| U-103 | Enviar header `X-User-ID` con UUID de usuario inexistente | Lanza `HTTPException(404)` con mensaje "Usuario no encontrado" | `verify_admin_role()` o `verify_teacher_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |
| U-104 | Usuario con rol `student` intenta acceder a endpoint protegido para admin | Lanza `HTTPException(403)` con mensaje "Acceso denegado: Se requiere rol admin" | `verify_admin_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Andy Calizaya |
| U-105 | Usuario con rol `student` intenta acceder a endpoint protegido para teacher | Lanza `HTTPException(403)` con mensaje "Acceso denegado: Se requiere rol teacher o admin" | `verify_teacher_role()`, tabla `users` | Backend FastAPI + PostgreSQL | Gregory Huanca |

---

### Resumen General

| Módulo | Casos de Éxito | Casos de Fracaso | Total |
| :--- | :---: | :---: | :---: |
| Autenticación (CU-01, CU-02) | 5 | 5 | 10 |
| Estudiante (CU-03 a CU-10) | 17 | 14 | 31 |
| Docente (CU-11 a CU-19) | 16 | 16 | 32 |
| Administrador (CU-20 a CU-24) | 12 | 10 | 22 |
| Transversales (Middleware) | 2 | 5 | 7 |
| **TOTAL** | **52** | **50** | **102** |

---

#### Información requerida por caso
* **ID.** Identificador único del caso de prueba (U-001 a U-105).
* **Descripción detallada.** Acción que se ejecuta y datos de entrada.
* **Resultado esperado.** Valor de retorno, excepción, o efecto en la base de datos.
* **Dependencias.** Servicios, schemas, tablas y APIs externas involucradas.
* **Ambiente requerido.** Infraestructura necesaria (FastAPI, PostgreSQL, ChromaDB, Docker sandbox, APIs externas).
* **Responsable.** Miembro del equipo asignado (Andy Calizaya / Gregory Huanca).