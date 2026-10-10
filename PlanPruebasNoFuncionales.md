### 6. Plan de Pruebas No Funcionales

#### Objetivo
Validar que la plataforma ALDA (AI-based Learning & Development Assistant) cumple con los atributos de calidad definidos en los Requerimientos No Funcionales (RNF-01 a RNF-08), verificando aspectos de seguridad de acceso, desempeño de IA, rendimiento de ejecución, disponibilidad, compatibilidad, usabilidad, fiabilidad y aislamiento de seguridad desde la perspectiva del usuario final y del sistema en producción.

---

## Categoría de Calidad 1 — Seguridad de Acceso

### RNF-01 — El acceso debe estar limitado a la comunidad universitaria con cuentas institucionales @virtual.upt.pe o personal validado en la Lista Blanca

**Criterio de aceptación:** Cualquier intento de inicio de sesión con un dominio distinto a @virtual.upt.pe debe ser rechazado en el 100% de los casos, exceptuando aquellos registrados previamente por el Administrador en la Lista Blanca.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-001 | Seguridad de Acceso | Verificación de bloqueo total de dominios externos | RNF-01 | CU-01, CU-02 | Se ejecutan 50 intentos de login con correos de dominios variados (@gmail.com, @hotmail.com, @outlook.com, @yahoo.com, @universidad.edu). El sistema rechaza el 100% de los intentos (50/50), mostrando el mensaje "Solo correos institucionales o autorizados están permitidos" | Prueba automatizada con script que ejecuta 50 solicitudes POST al endpoint de autenticación con correos no autorizados y verifica que el código de respuesta sea 403 en todos los casos |
| NF-002 | Seguridad de Acceso | Acceso exitoso con correo institucional válido | RNF-01 | CU-01, CU-02 | Se ejecutan 20 intentos de login con correos @virtual.upt.pe válidos. El sistema concede acceso al 100% (20/20) y redirige al dashboard correspondiente según el rol del usuario | Prueba automatizada verificando código 200 y redirección correcta al dashboard del rol asignado |
| NF-003 | Seguridad de Acceso | Acceso exitoso mediante Lista Blanca | RNF-01 | CU-01, CU-23 | Se registran 5 correos externos en la Lista Blanca y se intentan 5 logins. El sistema concede acceso al 100% (5/5) sin importar el dominio del correo | Prueba funcional: agregar correos vía CU-23, luego ejecutar login con cada correo y verificar acceso exitoso |
| NF-004 | Seguridad de Acceso | Normalización de dominio en validación | RNF-01 | CU-02 | Se intenta login con variaciones de capitalización del dominio: @Virtual.UPT.pe, @VIRTUAL.UPT.PE, @virtual.Upt.Pe. El sistema normaliza a minúsculas y concede acceso en todos los casos | Prueba con 10 variaciones de capitalización, verificando 100% de aceptación tras normalización |
| NF-005 | Seguridad de Acceso | Consistencia del bloqueo bajo carga concurrente | RNF-01 | CU-01 | Se ejecutan 100 solicitudes simultáneas de login con correos no autorizados usando herramientas de carga. El sistema rechaza el 100% de las solicitudes sin excepción, incluso bajo presión concurrente | Prueba de carga con JMeter/Locust: 100 peticiones concurrentes al endpoint de login con correos no autorizados, verificando que ninguna logre acceso |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-006 | Seguridad de Acceso | Bypass de validación por manipulación de token | RNF-01 | CU-01, CU-02 | Se intenta acceder al sistema modificando manualmente el token JWT para cambiar el campo de email a un dominio institucional. El sistema detecta la manipulación y rechaza el acceso con error de autenticación | Prueba de penetración: interceptar token con herramienta (Burp Suite), modificar payload del JWT y enviar al servidor. Verificar que el servidor valide la firma y rechace tokens alterados |
| NF-007 | Seguridad de Acceso | Acceso tras remoción de Lista Blanca | RNF-01 | CU-23, CU-01 | Un correo externo previamente autorizado en la Lista Blanca es removido por el administrador. Al intentar login nuevamente, el sistema rechaza el acceso inmediatamente con mensaje de correo no autorizado | Prueba secuencial: login exitoso → remoción de whitelist → login rechazado. Verificar que la política se aplique en tiempo real |
| NF-008 | Seguridad de Acceso | Inyección SQL en campo de email | RNF-01 | CU-01 | Se intenta login con payloads de inyección SQL en el campo de email (ej: `admin'--@virtual.upt.pe`, `' OR 1=1--`). El sistema sanitiza la entrada y rechaza el acceso sin exponer información de la base de datos | Prueba de seguridad con 20 payloads de inyección SQL comunes, verificando que ninguno logre bypass ni genere errores de BD expuestos al usuario |

---

## Categoría de Calidad 2 — Desempeño de IA

### RNF-02 — El tiempo de respuesta del tutor socrático debe ser fluido para no interrumpir el aprendizaje

**Criterio de aceptación:** Las respuestas generadas por la IA deben mostrarse en la interfaz en un tiempo máximo de 5 segundos.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-009 | Desempeño de IA | Tiempo de respuesta con consulta simple | RNF-02 | CU-07 | El estudiante envía una consulta breve al tutor (ej: "¿Qué es un puntero?") sin contexto de laboratorio. La respuesta del tutor se muestra en la interfaz en un tiempo ≤ 5 segundos desde el envío | Medición de tiempo con cronómetro de red (DevTools > Network): registrar timestamp de envío de request y timestamp de última respuesta recibida. Ejecutar 10 consultas y calcular promedio |
| NF-010 | Desempeño de IA | Tiempo de respuesta con contexto de laboratorio completo | RNF-02 | CU-07, CU-13 | El estudiante envía una consulta con código de 100 líneas, historial de 5 mensajes previos y contexto de un laboratorio con 10 test cases. La respuesta se muestra en ≤ 5 segundos | Prueba con payload completo (código + historial + contexto de lab). Medir tiempo de respuesta en 10 ejecuciones. El percentil 95 debe ser ≤ 5 segundos |
| NF-011 | Desempeño de IA | Tiempo de respuesta bajo carga normal (10 usuarios simultáneos) | RNF-02 | CU-07 | Con 10 estudiantes consultando al tutor simultáneamente, el sistema responde a cada uno en ≤ 5 segundos sin degradación significativa respecto a un solo usuario | Prueba de carga con 10 hilos concurrentes enviando consultas al endpoint del tutor IA. Medir tiempo de respuesta individual de cada hilo y verificar que ninguno supere los 5 segundos |
| NF-012 | Desempeño de IA | Respuesta con material RAG de base de conocimiento | RNF-02 | CU-07, CU-17 | El tutor busca contexto relevante en ChromaDB (con 50+ documentos indexados) y genera la respuesta socrática completa en ≤ 5 segundos, incluyendo el tiempo de búsqueda vectorial | Medir por separado: tiempo de búsqueda en ChromaDB + tiempo de generación de IA. La suma total debe ser ≤ 5 segundos |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-013 | Desempeño de IA | Degradación bajo carga alta (50+ usuarios) | RNF-02 | CU-07 | Con 50 usuarios consultando simultáneamente al tutor, se identifica a partir de qué umbral de concurrencia el tiempo de respuesta supera los 5 segundos. El sistema debe registrar un log de advertencia cuando el tiempo excede el umbral | Prueba de estrés incremental: 10, 20, 30, 40, 50 usuarios concurrentes. Graficar tiempo de respuesta vs. concurrencia para identificar punto de degradación |
| NF-014 | Desempeño de IA | Timeout de la API de IA externa | RNF-02 | CU-07, CU-24 | Cuando la API de Google GenAI no responde dentro de los 5 segundos, el sistema muestra un mensaje de error amigable al estudiante ("El servicio de IA no está disponible temporalmente") en lugar de dejar la interfaz colgada indefinidamente | Simular latencia alta en la API externa (mock con delay de 10s). Verificar que el sistema aplique timeout y devuelva error controlado al usuario en ≤ 6 segundos |
| NF-015 | Desempeño de IA | Impacto de base de conocimiento muy grande | RNF-02 | CU-07, CU-17 | Con una base de conocimiento de 500+ documentos en ChromaDB, el tiempo de búsqueda vectorial degrada el tiempo total de respuesta por encima de los 5 segundos | Prueba de rendimiento: indexar 500 documentos de prueba en ChromaDB, ejecutar 10 consultas al tutor y medir si la búsqueda semántica mantiene el tiempo total ≤ 5 segundos |

---

## Categoría de Calidad 3 — Rendimiento de Ejecución

### RNF-03 — La compilación y ejecución de código en el entorno seguro debe ser ágil

**Criterio de aceptación:** El resultado de salida (stdout/stderr) debe retornar al usuario en menos de 2 segundos tras solicitar la ejecución.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-016 | Rendimiento de Ejecución | Compilación y ejecución de programa simple en C++ | RNF-03 | CU-05 | El estudiante ejecuta un programa "Hello World" en C++ (5 líneas). El resultado aparece en la consola en < 2 segundos desde que presionó "Ejecutar". El tiempo incluye: envío al servidor, compilación con g++, ejecución en sandbox Docker y retorno de stdout | Medir tiempo total desde click "Ejecutar" hasta aparición de resultado en consola. Ejecutar 20 veces y verificar que el percentil 95 sea < 2 segundos |
| NF-017 | Rendimiento de Ejecución | Ejecución de programa Python simple | RNF-03 | CU-05 | Un script Python de 10 líneas (operaciones básicas, prints) se ejecuta y retorna resultado en < 2 segundos | Medición de tiempo con DevTools Network. 20 repeticiones. Percentil 95 < 2 segundos |
| NF-018 | Rendimiento de Ejecución | Compilación y ejecución con programa de complejidad media | RNF-03 | CU-05 | Un programa C++ de 50 líneas con loops, arrays y funciones compila y ejecuta en < 2 segundos, retornando la salida correcta | Programa de prueba estandarizado (ordenamiento burbuja de 100 elementos). Medir tiempo total en 20 ejecuciones |
| NF-019 | Rendimiento de Ejecución | Ejecución concurrente de código (10 estudiantes) | RNF-03 | CU-05 | Con 10 estudiantes ejecutando código simultáneamente, cada uno recibe su resultado en < 2 segundos sin interferencia entre ejecuciones | Prueba de carga con 10 solicitudes POST concurrentes al endpoint de compilación. Verificar tiempo de respuesta individual y que los resultados no se mezclen entre usuarios |
| NF-020 | Rendimiento de Ejecución | Evaluación de test cases en tiempo aceptable | RNF-03 | CU-06 | El estudiante ejecuta su código contra 10 test cases de un laboratorio. El sistema compila una vez, ejecuta 10 veces con diferentes inputs y retorna todos los resultados en < 2 segundos por ejecución individual (< 20 segundos total para los 10 test cases) | Medir tiempo total de evaluación completa. Cada ejecución individual debe ser < 2 segundos |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-021 | Rendimiento de Ejecución | Degradación bajo carga alta (30+ ejecuciones simultáneas) | RNF-03 | CU-05 | Con 30 estudiantes ejecutando código simultáneamente, se identifica el punto donde el tiempo de respuesta supera los 2 segundos. El sistema debe encolar las solicitudes excedentes en lugar de rechazarlas | Prueba de estrés incremental: 5, 10, 15, 20, 25, 30 ejecuciones concurrentes. Graficar latencia vs. concurrencia |
| NF-022 | Rendimiento de Ejecución | Programa con consumo excesivo de CPU | RNF-03 | CU-05 | Un programa con algoritmo de alta complejidad (ej: cálculo de Fibonacci recursivo para n=45) excede el tiempo de ejecución del sandbox. El sistema termina la ejecución y retorna el mensaje de timeout en un tiempo razonable (< 5 segundos adicionales tras el límite) | Ejecutar programa deliberadamente costoso y verificar que el sandbox aplique el límite de tiempo y retorne error controlado |
| NF-023 | Rendimiento de Ejecución | Programa con consumo excesivo de memoria | RNF-03 | CU-05 | Un programa que intenta asignar 1 GB de memoria es terminado por el sandbox Docker antes de afectar otros procesos del servidor. El error se reporta al usuario como "La ejecución excedió los recursos permitidos" | Ejecutar programa que aloque memoria masiva y verificar que Docker aplique los límites de memoria |

---

## Categoría de Calidad 4 — Disponibilidad

### RNF-04 — El sistema debe estar operativo durante los periodos de laboratorios y estudio

**Criterio de aceptación:** Se debe garantizar una disponibilidad del 99.5% durante el ciclo académico, asegurando el acceso constante.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-024 | Disponibilidad | Monitoreo de uptime durante horario de laboratorio | RNF-04 | Todos los CU | El sistema responde correctamente a solicitudes de health check cada 5 minutos durante un periodo de 8 horas de laboratorio. El uptime medido es ≥ 99.5% (máximo 2.4 minutos de inactividad en 8 horas) | Script de monitoreo con pings al endpoint `/health` cada 5 minutos durante la jornada. Calcular porcentaje de respuestas exitosas (HTTP 200) |
| NF-025 | Disponibilidad | Disponibilidad del servicio tras reinicio del servidor | RNF-04 | Todos los CU | Después de un reinicio planificado del servidor, la plataforma vuelve a estar operativa en menos de 60 segundos, incluyendo la reconexión a PostgreSQL y ChromaDB | Medir tiempo desde reinicio del proceso del backend hasta que el endpoint `/health` retorne HTTP 200. Ejecutar 5 reinicios y promediar |
| NF-026 | Disponibilidad | Recuperación ante caída de ChromaDB | RNF-04 | CU-07, CU-17, CU-18 | Si ChromaDB se cae, las funcionalidades que no dependen de IA (login, ejecución de código, gestión de laboratorios, anuncios) continúan operando normalmente. Solo las funciones del tutor IA se degradan con mensaje informativo | Simular caída de ChromaDB (detener contenedor). Verificar que los endpoints de CU-01 a CU-06, CU-09 a CU-16, CU-19 a CU-24 continúen funcionando. Solo CU-07 y CU-17 deben mostrar error controlado |
| NF-027 | Disponibilidad | Continuidad operativa bajo carga sostenida | RNF-04 | Todos los CU | El sistema mantiene disponibilidad ≥ 99.5% durante una prueba de carga sostenida de 2 horas con 20 usuarios concurrentes realizando operaciones mixtas (login, ejecución de código, consultas IA, gestión de laboratorios) | Prueba de resistencia con Locust/JMeter: 20 usuarios virtuales ejecutando escenarios mixtos durante 2 horas. Medir tasa de errores y verificar que sea < 0.5% |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-028 | Disponibilidad | Caída de la base de datos PostgreSQL | RNF-04 | Todos los CU | Si PostgreSQL se cae, el sistema muestra un mensaje de mantenimiento en lugar de errores técnicos internos. Ningún endpoint expone stack traces o información sensible del servidor | Simular caída de PostgreSQL (detener servicio). Acceder a 10 endpoints diferentes y verificar que todos muestren mensajes controlados (HTTP 503 con mensaje de mantenimiento) |
| NF-029 | Disponibilidad | Pérdida de conexión a internet del usuario | RNF-04 | CU-05, CU-07 | Si el usuario pierde conexión durante una ejecución de código o consulta al tutor, la interfaz muestra un mensaje de "Sin conexión" y permite reintentar la operación al recuperar la conexión, sin pérdida del código escrito | Prueba manual: desconectar red durante operación activa. Verificar que el editor conserve el código y que la interfaz muestre estado de desconexión |
| NF-030 | Disponibilidad | Agotamiento de conexiones al pool de base de datos | RNF-04 | Todos los CU | Bajo carga extrema (100+ conexiones simultáneas), si el pool de conexiones se agota, el sistema encola las solicitudes pendientes y muestra "Servidor ocupado, por favor intente en unos segundos" en lugar de errores de conexión | Prueba de estrés: generar 100+ solicitudes simultáneas que requieran acceso a BD. Verificar comportamiento del pool de conexiones y mensajes de error controlados |

---

## Categoría de Calidad 5 — Compatibilidad

### RNF-05 — La plataforma debe ser accesible desde navegadores estándar sin plugins adicionales

**Criterio de aceptación:** Funcionamiento correcto en las últimas 2 versiones de Google Chrome, Mozilla Firefox y Microsoft Edge.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-031 | Compatibilidad | Funcionamiento completo en Google Chrome (últimas 2 versiones) | RNF-05 | Todos los CU | Todas las funcionalidades de la plataforma operan correctamente en las últimas 2 versiones de Google Chrome: login con Google OAuth, editor Monaco con resaltado de sintaxis, ejecución de código con respuesta en consola, chat con tutor IA, descarga de reportes Excel, y todas las operaciones CRUD | Prueba de regresión completa: ejecutar el plan de pruebas funcionales (F-001 a F-098) en Chrome versión actual y versión anterior. Todos los casos deben pasar |
| NF-032 | Compatibilidad | Funcionamiento completo en Mozilla Firefox (últimas 2 versiones) | RNF-05 | Todos los CU | Todas las funcionalidades operan correctamente en las últimas 2 versiones de Firefox. El editor Monaco renderiza correctamente, el autocompletado funciona, y las interacciones de arrastrar/soltar archivos PDF (CU-17) funcionan sin plugins adicionales | Prueba de regresión completa en Firefox versión actual y anterior. Verificar específicamente: editor Monaco, subida de archivos, descarga de reportes |
| NF-033 | Compatibilidad | Funcionamiento completo en Microsoft Edge (últimas 2 versiones) | RNF-05 | Todos los CU | Todas las funcionalidades operan correctamente en las últimas 2 versiones de Edge. La autenticación OAuth con Google funciona sin bloqueos de popup, y el editor Monaco tiene rendimiento comparable a Chrome | Prueba de regresión en Edge versión actual y anterior. Verificar especialmente: popup de Google OAuth, rendimiento del editor, descarga de archivos |
| NF-034 | Compatibilidad | Funcionamiento sin plugins adicionales | RNF-05 | Todos los CU | Un navegador recién instalado (sin extensiones ni plugins) puede acceder a todas las funcionalidades de la plataforma. No se requiere Flash, Java, Silverlight ni ninguna extensión de terceros | Prueba en navegador limpio (perfil nuevo sin extensiones). Navegar por todas las funcionalidades y verificar operación completa |
| NF-035 | Compatibilidad | Consistencia visual entre navegadores | RNF-05 | Todos los CU | La interfaz se renderiza de manera consistente entre Chrome, Firefox y Edge: mismos colores, tipografías, alineación de elementos, tamaños de botones y comportamiento responsive. No hay diferencias visuales significativas | Captura de pantalla automatizada en los 3 navegadores para 5 páginas clave (login, dashboard estudiante, editor, dashboard docente, panel admin). Comparación visual pixel a pixel con tolerancia del 5% |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-036 | Compatibilidad | Navegador obsoleto no soportado | RNF-05 | CU-01 | Si un usuario accede desde Internet Explorer 11 o una versión de Chrome/Firefox anterior a las 2 últimas, el sistema muestra un mensaje indicando "Tu navegador no es compatible. Por favor actualiza a la última versión de Chrome, Firefox o Edge" | Prueba en IE11 y versión antigua de Chrome. Verificar que el sistema muestre advertencia de compatibilidad en lugar de fallar silenciosamente |
| NF-037 | Compatibilidad | Funcionalidad JavaScript deshabilitada | RNF-05 | Todos los CU | Si el usuario tiene JavaScript deshabilitado, la plataforma muestra un mensaje informativo indicando que JavaScript es necesario para el funcionamiento, en lugar de mostrar una página en blanco | Deshabilitar JavaScript en navegador. Verificar que se muestre mensaje `<noscript>` informativo |

---

## Categoría de Calidad 6 — Usabilidad

### RNF-06 — La interfaz debe permitir una interacción rápida para alumnos de ciclos iniciales

**Criterio de aceptación:** Un estudiante debe poder obtener su primer análisis de código en menos de 3 clics desde el inicio de su sesión.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-038 | Usabilidad | Conteo de clics para primer análisis desde el dashboard | RNF-06 | CU-01, CU-05, CU-07 | Desde el dashboard del estudiante (después del login), el estudiante puede obtener su primer análisis de código en ≤ 3 clics: (1) Clic en "Sala de Práctica" o seleccionar un laboratorio, (2) Escribir código en el editor y clic en "Ejecutar" o "Pedir ayuda al tutor", (3) Ver resultado/análisis. Total: 2-3 clics | Prueba de usabilidad con 5 usuarios reales. Registrar la cantidad de clics desde el dashboard hasta ver el primer análisis de código. Todos deben lograrlo en ≤ 3 clics |
| NF-039 | Usabilidad | Navegación intuitiva para usuario nuevo | RNF-06 | CU-01, CU-03, CU-04 | Un estudiante de primer ciclo que usa la plataforma por primera vez puede identificar dónde escribir código, cómo ejecutarlo y cómo pedir ayuda al tutor sin necesidad de un manual o tutorial previo. El tiempo para completar la primera tarea es ≤ 3 minutos | Prueba de usabilidad con 5 estudiantes nuevos sin capacitación previa. Medir tiempo desde el primer login hasta la primera ejecución de código exitosa. Registrar dudas y dificultades |
| NF-040 | Usabilidad | Accesibilidad de elementos interactivos | RNF-06 | Todos los CU | Todos los botones de acción principal (Ejecutar, Evaluar, Enviar al Tutor, Crear Laboratorio, Publicar Anuncio) tienen etiquetas claras, son visibles sin necesidad de scroll y tienen un tamaño mínimo de 44x44 píxeles para facilitar la interacción | Inspección visual y medición con DevTools de todos los botones de acción principal. Verificar tamaño mínimo, contraste de color (WCAG AA) y texto descriptivo |
| NF-041 | Usabilidad | Retroalimentación visual en operaciones | RNF-06 | CU-05, CU-06, CU-07 | Cuando el estudiante ejecuta código, evalúa test cases o consulta al tutor, la interfaz muestra un indicador de carga (spinner/barra de progreso) que informa al usuario que la operación está en proceso | Verificar que todas las operaciones asíncronas muestren indicador de carga. No debe haber momentos donde la interfaz parezca "congelada" sin retroalimentación |
| NF-042 | Usabilidad | Mensajes de error comprensibles | RNF-06 | Todos los CU | Todos los mensajes de error que el sistema muestra al usuario están en español, usan lenguaje no técnico y sugieren una acción correctiva. No se muestran códigos HTTP, stack traces ni mensajes en inglés del servidor | Revisar los 40 casos de fracaso del plan funcional y verificar que cada mensaje de error sea comprensible para un estudiante de primer ciclo |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-043 | Usabilidad | Flujo de más de 3 clics detectado | RNF-06 | CU-05, CU-07 | Si algún flujo de la interfaz requiere más de 3 clics para que el estudiante obtenga su primer análisis, se documenta como defecto de usabilidad y se propone una mejora en la navegación | Mapeo completo de la ruta de clics en cada flujo posible desde el dashboard hasta el primer análisis. Documentar cualquier ruta que exceda 3 clics |
| NF-044 | Usabilidad | Interfaz confusa para funciones del docente | RNF-06 | CU-11 a CU-19 | Si un docente nuevo no puede encontrar cómo crear un laboratorio (CU-13) en menos de 60 segundos, se documenta como defecto de usabilidad | Prueba con 3 docentes nuevos sin capacitación. Medir tiempo para localizar y completar la creación de un laboratorio. Objetivo: < 60 segundos para encontrar la función |

---

## Categoría de Calidad 7 — Precisión y Fiabilidad

### RNF-07 — El sistema debe clasificar correctamente los fallos de código capturados del entorno de ejecución

**Criterio de aceptación:** El módulo de captura debe identificar el tipo de error (sintaxis, lógica o ejecución) con una precisión del 90%.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-045 | Precisión (Fiabilidad) | Clasificación correcta de errores de sintaxis | RNF-07 | CU-05, CU-12 | Se ejecutan 20 programas con errores de sintaxis conocidos (falta de punto y coma, paréntesis sin cerrar, palabras clave mal escritas). El sistema clasifica correctamente al menos el 90% (18/20) como "Errores de sintaxis" | Batch de 20 programas con errores de sintaxis deliberados. Ejecutar cada uno y verificar que el feedback del sistema incluya la clasificación correcta |
| NF-046 | Precisión (Fiabilidad) | Clasificación correcta de errores de ejecución (runtime) | RNF-07 | CU-05, CU-12 | Se ejecutan 20 programas con errores de ejecución (división por cero, segmentation fault, null pointer, desbordamiento de arreglo). El sistema clasifica correctamente al menos el 90% (18/20) como errores de ejecución en la categoría correspondiente | Batch de 20 programas con errores runtime conocidos. Verificar clasificación contra la categoría esperada (punteros/memoria, desbordamiento, tipo, etc.) |
| NF-047 | Precisión (Fiabilidad) | Clasificación correcta de errores de lógica | RNF-07 | CU-06, CU-12 | Se ejecutan 20 programas que compilan y ejecutan sin errores, pero producen salida incorrecta (errores de lógica). El sistema identifica al menos el 90% (18/20) como "Errores de lógica" basándose en la comparación con los resultados esperados de los test cases | Batch de 20 programas con lógica incorrecta pero compilables. Evaluar contra test cases y verificar que el sistema clasifique el fallo como error de lógica |
| NF-048 | Precisión (Fiabilidad) | Precisión general del clasificador | RNF-07 | CU-12 | Se ejecuta un lote mixto de 60 programas (20 con errores de sintaxis, 20 de ejecución, 20 de lógica). El sistema clasifica correctamente al menos el 90% del total (54/60). Se genera una matriz de confusión para identificar patrones de error | Lote estandarizado de 60 programas. Calcular precisión total, precisión por categoría y generar matriz de confusión |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-049 | Precisión (Fiabilidad) | Error ambiguo entre categorías | RNF-07 | CU-05, CU-12 | Programas con errores que podrían clasificarse en múltiples categorías (ej: un cast implícito que causa un error runtime) son documentados como casos límite. El sistema clasifica en al menos una categoría válida | 10 programas con errores ambiguos. Documentar la clasificación del sistema y evaluar si es razonable, aunque no sea la categoría primaria esperada |
| NF-050 | Precisión (Fiabilidad) | Clasificación de errores en lenguajes no principales | RNF-07 | CU-05, CU-12 | Se verifica si la precisión de clasificación se mantiene ≥ 90% en todos los lenguajes soportados (C++, Python, Java, JavaScript) o si hay degradación significativa en algún lenguaje específico | 15 programas con errores por cada lenguaje (60 total). Comparar precisión entre lenguajes y documentar diferencias significativas |

---

## Categoría de Calidad 8 — Aislamiento de Seguridad

### RNF-08 — El código del estudiante no debe tener capacidad de comprometer el servidor

**Criterio de aceptación:** El entorno de ejecución debe estar aislado al 100%; el código del alumno no tendrá acceso a archivos o red interna del servidor.

#### Casos de Éxito

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-051 | Aislamiento de Seguridad | Bloqueo de acceso al sistema de archivos del host | RNF-08 | CU-05 | Un programa que intenta leer archivos del sistema host (`/etc/passwd`, `/etc/shadow`, variables de entorno del servidor) no obtiene acceso y retorna error de permisos. El código solo puede acceder a su directorio temporal de ejecución | Ejecutar 10 programas que intenten operaciones de lectura en rutas sensibles del sistema. Verificar que todos fallen con error de permisos sin exponer contenido del host |
| NF-052 | Aislamiento de Seguridad | Bloqueo de acceso a red interna | RNF-08 | CU-05 | Un programa que intenta abrir sockets, hacer requests HTTP a la red interna, o realizar DNS lookups es bloqueado por el sandbox. No puede comunicarse con otros servicios del servidor (PostgreSQL, ChromaDB, API backend) | Ejecutar programas que intenten: (1) HTTP request a localhost, (2) conexión TCP a puerto de PostgreSQL, (3) DNS lookup de hosts internos. Todos deben ser bloqueados |
| NF-053 | Aislamiento de Seguridad | Bloqueo de ejecución de comandos del sistema | RNF-08 | CU-05 | Un programa que intenta ejecutar comandos del sistema (`system()`, `exec()`, `os.system()`, `subprocess.run()`) para obtener información del host o modificar el entorno es bloqueado por el sandbox | Ejecutar programas con llamadas a `system("whoami")`, `system("ls /")`, `os.system("cat /etc/hostname")`. Verificar que todos sean bloqueados o ejecutados en el contexto aislado sin acceso al host |
| NF-054 | Aislamiento de Seguridad | Aislamiento entre ejecuciones de diferentes estudiantes | RNF-08 | CU-05 | Dos estudiantes ejecutando código simultáneamente no pueden ver ni acceder a los archivos temporales del otro. Cada ejecución tiene su propio espacio aislado que se destruye al finalizar | Ejecución simultánea: Estudiante A escribe un archivo temporal, Estudiante B intenta leerlo. Verificar que B no pueda acceder al archivo de A |
| NF-055 | Aislamiento de Seguridad | Limpieza de recursos tras ejecución | RNF-08 | CU-05 | Después de cada ejecución, el contenedor Docker se destruye completamente. No quedan archivos temporales, procesos huérfanos ni residuos de la ejecución anterior en el servidor | Ejecutar un programa que crea archivos y procesos. Verificar post-ejecución que el contenedor fue eliminado y no quedan rastros en el host |

#### Casos de Fracaso

| Caso | Categoría de Calidad | Escenario de Prueba | RNF Asociado | CU de Referencia | Resultado Esperado | Método de Verificación |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NF-056 | Aislamiento de Seguridad | Fork bomb (denegación de servicio desde código) | RNF-08 | CU-05 | Un programa que intenta crear procesos infinitamente (fork bomb: `:(){ :|:& };:`) es contenido por los límites del sandbox Docker (PID limit). El servidor principal no se ve afectado y continúa atendiendo otros usuarios | Ejecutar fork bomb controlada. Verificar que: (1) el contenedor sea terminado, (2) el servidor continúe respondiendo, (3) otros usuarios no experimenten degradación |
| NF-057 | Aislamiento de Seguridad | Escritura masiva en disco desde código | RNF-08 | CU-05 | Un programa que intenta llenar el disco escribiendo archivos gigantes (ej: escritura en loop infinito) es limitado por la cuota de disco del sandbox. No afecta el almacenamiento del servidor host | Ejecutar programa que escriba datos infinitamente. Verificar que el sandbox aplique límite de disco y termine la ejecución sin impactar el almacenamiento del host |
| NF-058 | Aislamiento de Seguridad | Escalación de privilegios dentro del sandbox | RNF-08 | CU-05 | Un programa que intenta escalar privilegios dentro del contenedor (ej: explotar vulnerabilidades de kernel, usar `sudo`, montar sistemas de archivos) es bloqueado por la configuración de seguridad del contenedor (no-root, seccomp, AppArmor) | Ejecutar 5 técnicas comunes de escalación de privilegios en contenedor. Verificar que todas sean bloqueadas por las políticas de seguridad configuradas |

---

### Resumen General del Plan de Pruebas No Funcionales

| Categoría de Calidad | RNF | Casos de Éxito | Casos de Fracaso | Total |
| :--- | :---: | :---: | :---: | :---: |
| Seguridad de Acceso (RNF-01) | RNF-01 | 5 | 3 | 8 |
| Desempeño de IA (RNF-02) | RNF-02 | 4 | 3 | 7 |
| Rendimiento de Ejecución (RNF-03) | RNF-03 | 5 | 3 | 8 |
| Disponibilidad (RNF-04) | RNF-04 | 4 | 3 | 7 |
| Compatibilidad (RNF-05) | RNF-05 | 5 | 2 | 7 |
| Usabilidad (RNF-06) | RNF-06 | 5 | 2 | 7 |
| Precisión y Fiabilidad (RNF-07) | RNF-07 | 4 | 2 | 6 |
| Aislamiento de Seguridad (RNF-08) | RNF-08 | 5 | 3 | 8 |
| **TOTAL** | **8 RNF** | **37** | **21** | **58** |

---

#### Información requerida por caso
* **Categoría de calidad.** Atributo de calidad del sistema que se evalúa (Seguridad, Rendimiento, Disponibilidad, Compatibilidad, Usabilidad, Fiabilidad, Aislamiento).
* **Escenario de prueba.** Situación específica que se simula para verificar el cumplimiento del requerimiento no funcional.
* **RNF asociado.** Referencia al requerimiento no funcional (RNF-01 a RNF-08) que valida la prueba.
* **CU de referencia.** Caso(s) de uso funcionales que sirven como contexto o escenario para ejecutar la prueba no funcional.
* **Resultado esperado.** Comportamiento observable que debe producirse, incluyendo métricas cuantitativas cuando aplica.
* **Método de verificación.** Herramientas, técnicas o procedimientos específicos para ejecutar y medir la prueba.