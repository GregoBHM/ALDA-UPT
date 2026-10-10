### 5. Plan de Pruebas Funcionales

#### Objetivo
Validar que cada funcionalidad de la plataforma ALDA (AI-based Learning & Development Assistant) cumpla con los requerimientos del negocio definidos en los casos de uso, verificando que las reglas de negocio, permisos por rol, flujos de usuario y restricciones se apliquen correctamente desde la perspectiva del usuario final.

---

## Área Funcional 1 — Autenticación y Control de Acceso

### CU-01 — Iniciar sesión con cuenta Google

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-001 | Autenticación | Login con Google OAuth | CU-01 | El usuario hace clic en "Iniciar sesión con Google", selecciona su cuenta institucional `@virtual.upt.pe`, el sistema verifica el dominio y la carrera, y redirige al dashboard correspondiente según su rol (estudiante, docente o admin) | Solo correos institucionales `@virtual.upt.pe` o correos en la lista blanca tienen acceso. El usuario debe pertenecer a Ingeniería de Sistemas |
| F-002 | Autenticación | Registro automático de nuevo usuario | CU-01 | Un usuario que inicia sesión por primera vez con correo institucional válido se registra automáticamente con `role=student`, `is_active=true` y se guarda su nombre, email y foto de perfil de Google | Rol por defecto es `student`. Solo un administrador puede cambiar el rol posteriormente (CU-21) |
| F-003 | Autenticación | Login de usuario existente | CU-01 | Un usuario que ya tiene cuenta inicia sesión, el sistema actualiza su `last_login` y `avatar_url`, y lo redirige al dashboard de su rol actual | El campo `last_login` debe actualizarse en cada inicio de sesión |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-004 | Autenticación | Rechazo de correo no autorizado | CU-01 | El sistema muestra mensaje de error "Solo correos institucionales o autorizados están permitidos" y no permite el acceso cuando se usa un correo `@gmail.com`, `@hotmail.com` u otro dominio no institucional que no está en la whitelist | Regla de negocio: acceso restringido exclusivamente a dominio institucional o lista blanca |
| F-005 | Autenticación | Rechazo por carrera no válida | CU-01 | El sistema muestra mensaje "No tienes acceso: No figuras como estudiante de Ingeniería de Sistemas" cuando el correo es institucional pero el nombre no corresponde a un alumno registrado en Ing. de Sistemas | Regla de negocio: verificación de carrera mediante API externa de la universidad |
| F-006 | Autenticación | Bloqueo de usuario suspendido | CU-01, CU-22 | El sistema muestra pantalla de cuenta suspendida y no permite acceso cuando el usuario tiene `is_active=false` | Un usuario suspendido por el admin no puede acceder hasta ser reactivado |

---

### CU-02 — Validar acceso por dominio institucional

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-007 | Autenticación | Validación de dominio | CU-02 | El sistema acepta correos con dominio `@virtual.upt.pe` independientemente de mayúsculas/minúsculas en el dominio | El email se normaliza a minúsculas antes de la validación |
| F-008 | Autenticación | Acceso por lista blanca | CU-02, CU-23 | Los correos registrados en la lista blanca (`allowed_emails`) acceden sin necesidad de pertenecer al dominio institucional ni pasar por verificación de carrera | La lista blanca es gestionada exclusivamente por administradores (CU-23) |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-009 | Autenticación | Servicio de verificación no disponible | CU-02 | El sistema muestra mensaje "El servicio de verificación de la universidad está temporalmente inactivo" cuando la API externa no responde | El sistema no debe permitir el acceso cuando no puede confirmar la identidad del estudiante |

---

## Área Funcional 2 — Funcionalidades del Estudiante

### CU-03 — Consultar panel de progreso personal

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-010 | Estudiante | Visualización de métricas personales | CU-03 | El dashboard del estudiante muestra: cantidad de laboratorios disponibles, horas de práctica estimadas (calculadas como `intentos × 0.25`), número de pistas de IA utilizadas, total de intentos y el último laboratorio practicado con su dificultad | Las horas de práctica se calculan multiplicando el total de intentos por 0.25 horas |
| F-011 | Estudiante | Dashboard de estudiante nuevo | CU-03 | Un estudiante recién registrado ve el dashboard con todas las métricas en cero y sin último laboratorio | El dashboard no debe mostrar datos de otros estudiantes |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-012 | Estudiante | Aislamiento de datos personales | CU-03 | El sistema solo muestra métricas del estudiante autenticado. No es posible ver progreso de otro estudiante manipulando la URL o parámetros | Regla de negocio: cada estudiante solo accede a sus propios datos de progreso |

---

### CU-04 — Explorar catálogo de retos disponibles

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-013 | Estudiante | Listado de retos | CU-04 | El estudiante ve el catálogo completo de laboratorios con: título, descripción, nivel de dificultad (fácil/medio/difícil), si es examen, nombre del docente creador, fecha de creación y los casos de prueba visibles | Los laboratorios se ordenan del más reciente al más antiguo |
| F-014 | Estudiante | Ocultamiento de test cases | CU-04, CU-13 | Los casos de prueba marcados como ocultos (`is_hidden=true`) por el docente NO se muestran al estudiante, pero sí se refleja el total de test cases existentes | Regla de negocio: los test cases ocultos se usan para evaluación pero no deben ser visibles para evitar que el estudiante ajuste su código a los casos específicos |
| F-015 | Estudiante | Catálogo vacío | CU-04 | Si no hay laboratorios creados, el sistema muestra un mensaje indicando que no hay retos disponibles | El catálogo no debe mostrar errores cuando está vacío |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-016 | Estudiante | Acceso sin autenticación | CU-04 | El sistema redirige al login si un usuario no autenticado intenta acceder al catálogo de retos | Todos los endpoints del estudiante requieren autenticación |

---

### CU-05 — Escribir y ejecutar código en el editor

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-017 | Estudiante | Compilación y ejecución de código C++ | CU-05 | El estudiante escribe código C++ en el editor Monaco, presiona "Ejecutar", el sistema compila y ejecuta el código en un sandbox seguro y muestra la salida en la consola integrada | La ejecución se realiza en un contenedor Docker aislado por seguridad |
| F-018 | Estudiante | Ejecución de código Python | CU-05 | El estudiante selecciona el lenguaje Python, escribe código y lo ejecuta. El sistema interpreta el código y muestra la salida | Lenguajes soportados: C++, Python, Java, JavaScript |
| F-019 | Estudiante | Consola interactiva | CU-05 | El estudiante puede interactuar con la entrada estándar (stdin) del programa en ejecución a través de la consola integrada | La consola debe soportar entrada/salida en tiempo real |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-020 | Estudiante | Error de compilación | CU-05 | Cuando el código tiene errores de sintaxis, el sistema muestra los mensajes de error del compilador con número de línea y descripción del error en la consola | El sistema debe mostrar errores claros para que el estudiante corrija su código |
| F-021 | Estudiante | Código vacío | CU-05 | El sistema no permite ejecutar si el campo de código está vacío y muestra un mensaje de validación | El campo `code` es obligatorio en el schema `CompileRequest` |
| F-022 | Estudiante | Timeout por bucle infinito | CU-05 | Si el programa excede el tiempo límite de ejecución (ej: bucle infinito), el sistema termina la ejecución y muestra "La ejecución excedió el tiempo límite" | Regla de negocio: existe un tiempo máximo de ejecución para proteger los recursos del servidor |

---

### CU-06 — Evaluar código con casos de prueba

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-023 | Estudiante | Evaluación exitosa total | CU-06 | El estudiante ejecuta su código contra los test cases del laboratorio. El sistema ejecuta el código con cada `input_data` y compara la salida con `expected_output`. Si todos pasan, muestra resultado ✅ APROBADO | La comparación puede ser: exacta (`exact`), por expresión regular (`regex`) o semántica con IA (`ai_semantic`) según `evaluation_type` |
| F-024 | Estudiante | Evaluación parcial | CU-06 | El código pasa algunos test cases y falla otros. El sistema muestra el detalle de cuáles pasaron (✅) y cuáles fallaron (❌) con la salida esperada vs. la obtenida | El estudiante debe poder ver qué test cases falló para corregir su código |
| F-025 | Estudiante | Evaluación con test cases ocultos | CU-06, CU-13 | La evaluación incluye TODOS los test cases (visibles y ocultos). El estudiante ve el resultado de cada test case pero no el input/output de los ocultos | Regla de negocio: los test cases ocultos previenen que el estudiante hard-codee las respuestas |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-026 | Estudiante | Laboratorio inexistente | CU-06 | El sistema muestra error si se intenta evaluar código contra un `laboratory_id` que no existe | El `laboratory_id` es obligatorio en `RunTestsRequest` |
| F-027 | Estudiante | Error de compilación durante evaluación | CU-06 | Si el código no compila, ningún test case se ejecuta y se muestra el error de compilación | La evaluación no puede proceder si el código no es compilable |

---

### CU-07 — Solicitar guía al tutor inteligente

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-028 | Estudiante | Consulta al tutor socrático con contexto de laboratorio | CU-07 | El estudiante envía su código, una pregunta y el contexto del laboratorio al tutor. El sistema usa RAG (ChromaDB) para enriquecer el contexto con material del docente y Google GenAI genera una respuesta socrática (preguntas reflexivas, no respuestas directas). Se registra un intento con `ai_feedback` | Regla de negocio: el tutor NUNCA debe dar respuestas directas. Debe usar el Método Socrático. La respuesta se basa estrictamente en el material subido por el docente |
| F-029 | Estudiante | Consulta en sala de práctica libre | CU-07 | El estudiante consulta al tutor sin estar en un laboratorio específico. El tutor responde con base en la base de conocimiento general sin contexto de reto | El intento se guarda con `laboratory_id=null` |
| F-030 | Estudiante | Detección de código pegado | CU-07 | Si el campo `is_pasted=true` indica que el código fue pegado (no escrito por el estudiante), el tutor adapta su respuesta para fomentar la comprensión del código copiado | Regla de negocio: el tutor debe fomentar autonomía, no la copia de soluciones |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-031 | Estudiante | Mensajes vacíos al tutor | CU-07 | El sistema no permite enviar una consulta con lista de mensajes vacía y muestra error de validación | Se requiere al menos un mensaje en el historial de chat |
| F-032 | Estudiante | Servicio de IA no disponible | CU-07, CU-24 | El sistema muestra mensaje "El servicio de IA no está disponible temporalmente" cuando la API key no está configurada o es inválida | La funcionalidad del tutor depende de la configuración del admin (CU-24) |

---

### CU-08 — Calificar respuesta del tutor de IA

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-033 | Estudiante | Calificar como útil | CU-08 | El estudiante presiona el ícono 👍 en una respuesta del tutor. El sistema registra `ai_rating=1` y opcionalmente un comentario | Solo se permite calificar intentos propios del estudiante |
| F-034 | Estudiante | Calificar como no útil | CU-08 | El estudiante presiona el ícono 👎 en una respuesta del tutor. El sistema registra `ai_rating=-1` con comentario opcional | La calificación ayuda al docente a evaluar la calidad de las respuestas de la IA (CU-12) |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-035 | Estudiante | Rating fuera de rango | CU-08 | El sistema rechaza calificaciones diferentes a 1 (útil) o -1 (no útil) con mensaje "El rating debe ser 1 (útil) o -1 (no útil)" | Solo valores 1 y -1 son válidos para la calificación |
| F-036 | Estudiante | Calificar intento ajeno | CU-08 | El sistema rechaza la calificación si el `attempt_id` no pertenece al estudiante autenticado | Regla de negocio: un estudiante solo puede calificar sus propias interacciones con el tutor |

---

### CU-09 — Consultar historial de intentos

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-037 | Estudiante | Visualización de progreso | CU-09 | El estudiante ve su historial con: total de intentos, intentos con ayuda de IA, intentos independientes (sin IA), cantidad de laboratorios resueltos, total de laboratorios disponibles y los últimos 10 intentos recientes | La actividad reciente se limita a los 10 últimos intentos |
| F-038 | Estudiante | Indicadores de estado por intento | CU-09 | Cada intento reciente muestra: nombre del laboratorio (o "Sala de Práctica Libre"), número de intento, si usó asistente IA, si fue aprobado (✅) o reprobado (❌), y fecha | Un laboratorio se considera "resuelto" si tiene al menos un intento con "✅ APROBADO" en el feedback |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-039 | Estudiante | Historial de estudiante inexistente | CU-09 | El sistema muestra error "Usuario no encontrado" si se consulta el progreso de un email que no existe en la base de datos | El sistema debe validar la existencia del usuario antes de consultar intentos |

---

### CU-10 — Visualizar anuncios del docente

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-040 | Estudiante | Listado de anuncios | CU-10 | El estudiante ve los últimos 5 anuncios publicados por docentes, mostrando título, contenido completo y fecha de publicación, ordenados del más reciente al más antiguo | Se muestran máximo 5 anuncios. Los anuncios son de todos los docentes (no filtrados por sección o curso) |
| F-041 | Estudiante | Sin anuncios disponibles | CU-10 | Si no hay anuncios publicados, el sistema muestra un estado vacío con mensaje amigable | No debe mostrar errores cuando no hay anuncios |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-042 | Estudiante | Anuncios solo lectura | CU-10 | El estudiante no puede editar, eliminar ni crear anuncios. Solo tiene acceso de lectura | Regla de negocio: los anuncios son gestionados exclusivamente por docentes (CU-15, CU-16) |

---

## Área Funcional 3 — Funcionalidades del Docente

### CU-11 — Consultar panel de estadísticas de clase

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-043 | Docente | Visualización de estadísticas | CU-11 | El docente ve el panel con: total de estudiantes registrados, total de laboratorios creados, total de intentos realizados, intentos que usaron asistente de IA, tasa de independencia (% de intentos sin IA) y los 5 estudiantes con login más reciente | La tasa de independencia se calcula como `(1 - intentos_con_IA / total_intentos) × 100`. Si no hay intentos, la tasa es 100% |
| F-044 | Docente | Estadísticas con plataforma vacía | CU-11 | Si no hay estudiantes ni intentos, el panel muestra todos los valores en 0 y la tasa de independencia en 100% sin errores de cálculo | El sistema no debe generar división por cero |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-045 | Docente | Acceso restringido por rol | CU-11 | Un usuario con rol `student` no puede acceder al panel de estadísticas del docente. El sistema retorna "Acceso denegado" | Solo usuarios con rol `teacher` o `admin` pueden acceder a endpoints de docente |

---

### CU-12 — Revisar análisis de errores frecuentes

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-046 | Docente | Clasificación automática de errores | CU-12 | El sistema analiza los últimos 200 intentos con feedback de IA y clasifica los errores en categorías: "Errores de punteros/memoria", "Desbordamiento de arreglo", "Errores de sintaxis", "Bucles infinitos/lógica", "Errores de tipo" y "Otros errores" | La clasificación se basa en keywords presentes en el `ai_feedback`: puntero/null/segmentation, index/rango/bounds, syntax/sintaxis/semicolon, loop/bucle/infinit, type/tipo/cast |
| F-047 | Docente | Errores agrupados por laboratorio | CU-12 | El panel muestra el desglose de errores por laboratorio indicando: nombre del laboratorio, total de intentos, intentos con errores e intentos con IA | Permite al docente identificar qué laboratorios generan más dificultades |
| F-048 | Docente | Top 5 estudiantes con más dificultades | CU-12 | El sistema identifica y muestra los 5 estudiantes que más solicitudes de IA han realizado, ordenados de mayor a menor | Regla de negocio: máximo 5 estudiantes en el ranking. Ayuda al docente a brindar atención personalizada |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-049 | Docente | Análisis sin datos | CU-12 | Si no hay intentos con feedback de IA, el panel muestra estado vacío con `total_analyzed=0` y listas vacías | No debe mostrar errores cuando no hay datos para analizar |

---

### CU-13 — Crear laboratorio con casos de prueba

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-050 | Docente | Creación de reto completo | CU-13 | El docente llena el formulario con: título, descripción, dificultad (easy/medium/hard), si es examen, y una lista de casos de prueba (input, output esperado, visible/oculto, tipo de evaluación). El sistema crea el laboratorio y todos sus test cases de forma atómica | El título es obligatorio. La dificultad por defecto es "medium". El tipo de evaluación puede ser: exact, regex o ai_semantic |
| F-051 | Docente | Creación de laboratorio tipo examen | CU-13 | El docente marca `is_exam=true` al crear el laboratorio. El reto se identifica visualmente como examen en el catálogo de estudiantes | Los laboratorios tipo examen pueden tener reglas especiales de acceso o visualización |
| F-052 | Docente | Test cases con diferentes tipos de evaluación | CU-13 | El docente crea test cases con tipo "exact" (comparación exacta), "regex" (expresión regular) y "ai_semantic" (evaluación semántica con IA) dentro del mismo laboratorio | Cada test case puede tener un tipo de evaluación diferente |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-053 | Docente | Título vacío | CU-13 | El sistema muestra error de validación y no permite crear el laboratorio si el título está vacío | El campo `title` es obligatorio |
| F-054 | Docente | Test case con datos incompletos | CU-13 | El sistema rechaza test cases que no tengan `input_data` o `expected_output` definidos | Ambos campos son obligatorios en cada caso de prueba |

---

### CU-14 — Eliminar laboratorio propio

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-055 | Docente | Eliminación de laboratorio propio | CU-14 | El docente selecciona un laboratorio de su lista y lo elimina. El sistema borra el laboratorio, todos sus test cases y los intentos asociados en cascada | Solo el docente creador puede eliminar su laboratorio. La eliminación es irreversible y en cascada |
| F-056 | Docente | Admin elimina cualquier laboratorio | CU-14 | Un administrador puede eliminar laboratorios de cualquier docente sin restricción de pertenencia | Regla de negocio: el rol admin tiene permisos elevados sobre todos los recursos |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-057 | Docente | Eliminar laboratorio ajeno | CU-14 | El sistema muestra "No tienes permiso para eliminar este laboratorio" si un docente intenta eliminar un reto creado por otro docente | Regla de negocio: pertenencia del recurso. Solo el creador o un admin puede eliminar |
| F-058 | Docente | Laboratorio inexistente | CU-14 | El sistema muestra "Laboratorio no encontrado" si se intenta eliminar con un ID que no existe | Validación de existencia antes de eliminar |

---

### CU-15 — Publicar anuncio académico

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-059 | Docente | Publicar anuncio | CU-15 | El docente llena título y contenido del anuncio y lo publica. El anuncio queda inmediatamente visible para todos los estudiantes en su sección de anuncios (CU-10) | Título y contenido son campos obligatorios |
| F-060 | Docente | Visibilidad del anuncio | CU-15, CU-10 | Después de publicar, el anuncio aparece como el más reciente en la lista de anuncios visibles para los estudiantes | Los anuncios se ordenan por fecha de creación descendente |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-061 | Docente | Campos vacíos en anuncio | CU-15 | El sistema rechaza la publicación si el título o el contenido están vacíos y muestra errores de validación | Ambos campos son obligatorios |

---

### CU-16 — Eliminar anuncio propio

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-062 | Docente | Eliminar anuncio propio | CU-16 | El docente elimina un anuncio que él creó. El anuncio desaparece de la vista del docente y de la vista de los estudiantes | Solo el creador del anuncio puede eliminarlo (excepto admin) |
| F-063 | Docente | Admin elimina cualquier anuncio | CU-16 | Un administrador puede eliminar anuncios de cualquier docente | Regla de negocio: admin tiene permisos elevados |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-064 | Docente | Eliminar anuncio ajeno | CU-16 | El sistema muestra "Anuncio no encontrado" si un docente intenta eliminar un anuncio de otro docente (el filtro por `teacher_id` no lo encuentra) | El sistema filtra por pertenencia, no muestra el anuncio ajeno como eliminable |
| F-065 | Docente | Anuncio inexistente | CU-16 | El sistema muestra error si se intenta eliminar un anuncio con ID que no existe | Validación de existencia del recurso |

---

### CU-17 — Cargar material pedagógico para la IA

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-066 | Docente | Subida de texto de conocimiento | CU-17 | El docente ingresa un título y contenido de texto. El sistema indexa el texto en ChromaDB (chunking + embedding), lo guarda en la base de datos y confirma la cantidad de "chunks" creados. El tutor IA (CU-07) puede usar este material en sus respuestas | El material se vectoriza para búsqueda semántica. El título es descriptivo para identificar el recurso |
| F-067 | Docente | Subida de archivo PDF | CU-17 | El docente sube un archivo PDF. El sistema extrae el texto con `pdfplumber`, lo indexa en ChromaDB, guarda una copia física del archivo y almacena la metadata (título, preview de 500 caracteres, total de caracteres) | El PDF debe contener texto extraíble. Límite máximo: 100 MB |
| F-068 | Docente | Impacto en el tutor IA | CU-17, CU-07 | Después de subir material, el tutor IA incluye el nuevo conocimiento en sus respuestas a los estudiantes cuando el contexto es relevante | El sistema RAG (Retrieval-Augmented Generation) busca los fragmentos más relevantes del material subido |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-069 | Docente | PDF demasiado grande | CU-17 | El sistema rechaza archivos PDF mayores a 100 MB con mensaje indicando el tamaño y el límite | Regla de negocio: límite de 100 MB para proteger recursos del servidor |
| F-070 | Docente | PDF de imagen escaneada | CU-17 | El sistema rechaza PDFs que no contienen texto extraíble con mensaje "El PDF no contiene texto extraíble (podría ser una imagen escaneada)" | El sistema requiere texto para vectorizar. No soporta OCR |
| F-071 | Docente | PDF corrupto | CU-17 | El sistema muestra error de procesamiento si el archivo está dañado o no tiene formato PDF válido | Validación de integridad del archivo |

---

### CU-18 — Eliminar material de la base de conocimiento

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-072 | Docente | Eliminar material de conocimiento | CU-18 | El docente elimina un material de la lista. El sistema lo elimina de ChromaDB (vector store) y de la base de datos relacional (PostgreSQL) | La eliminación afecta ambas bases de datos. El tutor IA dejará de usar ese material en futuras respuestas |
| F-073 | Docente | Eliminación con ChromaDB caído | CU-18 | Si ChromaDB no está disponible, el sistema ignora el error de vectores y elimina correctamente el registro de PostgreSQL | Regla de negocio: la eliminación de BD tiene prioridad. El error de ChromaDB se maneja silenciosamente |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-074 | Docente | Material inexistente | CU-18 | El sistema muestra "Ítem no encontrado" si se intenta eliminar con una clave que no existe | Validación de existencia antes de eliminar |

---

### CU-19 — Generar reporte de calificaciones (PDF y Excel)

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-075 | Docente | Descarga de reporte Excel | CU-19 | El docente hace clic en "Exportar reporte" y descarga un archivo `.xlsx` con 2 hojas: **"Intentos Detallados"** (Estudiante, Correo, Laboratorio, N° Intento, Usó IA, Aprobado, Calificación IA, Fecha) y **"Por Laboratorio"** (Laboratorio, Total Intentos, Con IA, Aprobados, Tasa de Éxito %) | El reporte incluye los últimos 500 intentos. Las columnas tienen ancho auto-ajustado (máx. 40 caracteres) |
| F-076 | Docente | Reporte con plataforma vacía | CU-19 | Si no hay intentos, el archivo Excel se descarga con las hojas y encabezados de columnas correctos pero sin datos | El reporte no debe fallar cuando no hay datos |
| F-077 | Docente | Nombre del archivo con fecha | CU-19 | El archivo descargado se nombra `ALDA_Reporte_YYYY-MM-DD.xlsx` con la fecha del día de generación | El nombre del archivo incluye la fecha actual para diferenciar reportes |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-078 | Docente | Error de generación | CU-19 | Si ocurre un error de conexión a la BD durante la generación, el sistema muestra error y no descarga un archivo incompleto o corrupto | No se debe entregar un reporte parcial al usuario |

---

## Área Funcional 4 — Funcionalidades del Administrador

### CU-20 — Consultar estado general de la plataforma

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-079 | Administrador | Dashboard de la plataforma | CU-20 | El admin ve: total de usuarios registrados, total de compilaciones, total de consultas al asistente IA, llamadas del día actual, modelo de IA activo y tokens estimados consumidos (`consultas_IA × 800`) | Los tokens son una estimación. Las llamadas del día se calculan desde las 00:00 UTC |
| F-080 | Administrador | Logs de auditoría | CU-20 | El admin ve los últimos 50 eventos de la plataforma que combinan: compilaciones, consultas IA e inicios de sesión, ordenados por fecha descendente. Cada log muestra tipo, acción, usuario y timestamp | Máximo 50 logs. Se combinan intentos (últimos 50) y logins (últimos 20) |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-081 | Administrador | Acceso restringido | CU-20 | Usuarios con rol `student` o `teacher` no pueden acceder al dashboard de administración | Regla de negocio: solo el rol `admin` tiene acceso al panel de administración |

---

### CU-21 — Cambiar rol de un usuario

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-082 | Administrador | Promoción de estudiante a docente | CU-21 | El admin selecciona un usuario con rol `student` y lo cambia a `teacher`. El usuario ahora puede acceder a las funcionalidades de docente (CU-11 al CU-19) en su próxima sesión | Roles válidos: `student`, `teacher`, `admin` |
| F-083 | Administrador | Cambio de rol a admin | CU-21 | El admin puede otorgar rol `admin` a cualquier usuario, dándole acceso completo a la plataforma | Regla de negocio: no hay límite en la cantidad de administradores |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-084 | Administrador | Rol inválido | CU-21 | El sistema rechaza con "Rol inválido" si se intenta asignar un rol que no sea `student`, `teacher` o `admin` | Solo 3 roles permitidos en el sistema |
| F-085 | Administrador | Usuario inexistente | CU-21 | El sistema muestra "Usuario no encontrado" si el UUID no corresponde a ningún usuario | Validación de existencia del usuario objetivo |

---

### CU-22 — Suspender o reactivar acceso de un usuario

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-086 | Administrador | Suspensión de usuario | CU-22 | El admin cambia `is_active=false` para un usuario. El usuario suspendido no podrá iniciar sesión y verá pantalla de "cuenta suspendida" (CU-01) | El usuario suspendido pierde acceso inmediatamente en su próximo intento de login |
| F-087 | Administrador | Reactivación de usuario | CU-22 | El admin cambia `is_active=true` para un usuario suspendido. El usuario recupera el acceso con su mismo rol y datos intactos | La reactivación restaura el acceso completo según el rol del usuario |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-088 | Administrador | Auto-suspensión | CU-22 | El sistema rechaza con "No puedes cambiar tu propio estado" si el admin intenta suspenderse a sí mismo | Regla de negocio: un admin no puede auto-suspenderse para evitar bloquear el acceso administrativo al sistema |
| F-089 | Administrador | Usuario inexistente | CU-22 | El sistema muestra "Usuario no encontrado" si el UUID no corresponde a ningún usuario | Validación de existencia antes de cambiar estado |

---

### CU-23 — Gestionar lista de correos autorizados

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-090 | Administrador | Agregar correo a la whitelist | CU-23 | El admin ingresa un correo y una nota descriptiva. El sistema normaliza el email a minúsculas y lo agrega a la lista. El correo autorizado puede ahora acceder a la plataforma sin ser institucional (CU-01, CU-02) | El email se normaliza a minúsculas para evitar duplicados por capitalización |
| F-091 | Administrador | Listar correos autorizados | CU-23 | El admin ve la tabla de correos autorizados con email, nota descriptiva y fecha de registro, ordenados del más reciente al más antiguo | Lista completa de correos en la whitelist |
| F-092 | Administrador | Eliminar correo de la whitelist | CU-23 | El admin elimina un correo de la lista. El correo pierde acceso si no pertenece al dominio institucional | La eliminación es efectiva inmediatamente. El usuario con ese correo no podrá acceder en su próximo login si no es institucional |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-093 | Administrador | Correo duplicado | CU-23 | El sistema rechaza con "El correo ya está en la lista" si se intenta agregar un email que ya existe en la whitelist | Regla de negocio: no se permiten duplicados. La normalización a minúsculas previene duplicados por capitalización |
| F-094 | Administrador | Eliminar correo inexistente | CU-23 | El sistema muestra "Correo no encontrado en la lista" si se intenta eliminar un email que no está en la whitelist | Validación de existencia antes de eliminar |

---

### CU-24 — Configurar modelo de IA y claves del sistema

#### Casos de Éxito

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-095 | Administrador | Consultar configuración actual | CU-24 | El admin ve el formulario de configuración con los valores actuales de: API key de Gemini, API key de OpenAI y modelo activo (por defecto `gemini-2.5-flash`) | Las API keys se muestran al admin para verificación. El modelo por defecto es `gemini-2.5-flash` |
| F-096 | Administrador | Actualizar configuración completa | CU-24 | El admin actualiza la API key de Gemini, la API key de OpenAI y el modelo activo. Los cambios se persisten y afectan inmediatamente las consultas del tutor IA (CU-07) | Los cambios son de efecto inmediato. No requiere reiniciar el sistema |
| F-097 | Administrador | Actualización parcial | CU-24 | El admin actualiza solo un campo (ej: solo el modelo activo) y los demás campos se mantienen con su valor anterior | Los campos con valor `null` se ignoran en la actualización (upsert selectivo) |

#### Casos de Fracaso

| Caso | Área Funcional | Subproceso | Caso de Uso Asociado | Resultado Esperado | Restricciones Funcionales |
| :--- | :--- | :--- | :--- | :--- | :--- |
| F-098 | Administrador | API key inválida | CU-24, CU-07 | Si el admin guarda una API key inválida, la configuración se persiste pero el tutor IA dejará de funcionar. Los estudiantes verán error al solicitar tutoría | Regla de negocio: el sistema no valida la API key contra Google al momento de guardar. La validación ocurre al momento de uso |

---

### Resumen General del Plan de Pruebas Funcionales

| Área Funcional | Casos de Éxito | Casos de Fracaso | Total |
| :--- | :---: | :---: | :---: |
| Autenticación y Control de Acceso (CU-01, CU-02) | 5 | 4 | 9 |
| Funcionalidades del Estudiante (CU-03 a CU-10) | 20 | 14 | 34 |
| Funcionalidades del Docente (CU-11 a CU-19) | 21 | 14 | 35 |
| Funcionalidades del Administrador (CU-20 a CU-24) | 12 | 8 | 20 |
| **TOTAL** | **58** | **40** | **98** |

---

#### Información requerida por caso
* **Área funcional.** Módulo del sistema al que pertenece la prueba (Autenticación, Estudiante, Docente, Administrador).
* **Subproceso.** Acción o flujo específico dentro del área funcional.
* **Caso de uso asociado.** Referencia al caso de uso (CU-01 a CU-24) que valida la prueba.
* **Resultado esperado.** Comportamiento observable que debe producirse desde la perspectiva del usuario final.
* **Restricciones funcionales.** Reglas de negocio, validaciones y limitaciones que aplican al caso.