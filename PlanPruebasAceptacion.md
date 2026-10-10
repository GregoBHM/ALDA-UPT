### 7. Plan de Pruebas de Aceptación (UAT)

#### Objetivo
Validar, junto al usuario final representativo de cada rol (Estudiante, Docente, Administrador), que la plataforma ALDA satisface las necesidades del negocio académico de la Escuela de Ingeniería de Sistemas de la UPT. Las pruebas de aceptación verifican escenarios de negocio completos (end-to-end) desde la perspectiva del usuario, confirmando que el sistema está listo para su despliegue en producción.

#### Alcance
Las pruebas de aceptación cubren:
- **Pruebas de aceptación del usuario (UAT):** Validación de flujos completos por rol.
- **Pruebas de aceptación operacional:** Verificación de que el sistema opera correctamente en el entorno de producción.
- **Pruebas de aceptación contractual:** Cumplimiento de los requerimientos funcionales (CU-01 a CU-24) y no funcionales (RNF-01 a RNF-08) acordados.

#### Participantes

| Rol | Responsabilidad | Perfil |
| :--- | :--- | :--- |
| **Usuario clave (Estudiante)** | Ejecutar los escenarios UAT del rol Estudiante y validar que los flujos de aprendizaje cumplen sus expectativas | Estudiante de Ingeniería de Sistemas, ciclos iniciales (I-IV), con cuenta @virtual.upt.pe |
| **Usuario clave (Docente)** | Ejecutar los escenarios UAT del rol Docente y validar que las herramientas de gestión académica y monitoreo son adecuadas | Docente del curso de Algoritmos o Programación de la escuela de Ing. de Sistemas |
| **Líder funcional** | Aprobar o rechazar los resultados de cada escenario UAT, resolver disputas sobre criterios de aceptación | Coordinador académico o responsable del proyecto ALDA |
| **Responsable de QA** | Facilitar la ejecución de las pruebas, documentar resultados, registrar defectos encontrados | Miembro del equipo de desarrollo asignado al aseguramiento de calidad |
| **Responsable técnico** | Soporte durante la ejecución de pruebas, resolución de incidencias técnicas en tiempo real | Desarrollador principal del proyecto ALDA |

#### Criterios de Entrada (Precondiciones)
* Las pruebas funcionales (Plan §5) han sido ejecutadas con un 95% de casos exitosos.
* Las pruebas no funcionales (Plan §6) han sido ejecutadas y los RNF críticos (RNF-01, RNF-03, RNF-08) cumplen sus criterios de aceptación.
* El sistema está desplegado en un entorno de staging idéntico al de producción.
* Los datos de prueba están cargados: al menos 3 laboratorios, 5 estudiantes, 2 docentes y 1 administrador.
* Los participantes han sido notificados y tienen disponibilidad confirmada.

#### Criterios de Salida (Aceptación Final)
* El 100% de los escenarios de aceptación críticos (marcados como **Crítico**) han sido aprobados.
* Al menos el 90% de los escenarios totales han sido aprobados.
* Los defectos encontrados durante UAT han sido clasificados y los de severidad alta/crítica han sido resueltos.
* El líder funcional firma el acta de aceptación del sistema.

---

## Escenarios UAT por Rol de Usuario

### Rol 1 — Estudiante

#### Escenario UAT-01: Primer ingreso y orientación en la plataforma

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-01 |
| **Prioridad** | Crítico |
| **Actor** | Estudiante nuevo (primer ingreso) |
| **Precondición** | El estudiante tiene cuenta institucional @virtual.upt.pe y nunca ha accedido a la plataforma |
| **Flujo de negocio** | (1) El estudiante accede a la URL de ALDA → (2) Hace clic en "Iniciar sesión con Google" → (3) Selecciona su cuenta @virtual.upt.pe → (4) El sistema valida el dominio y la carrera → (5) Se registra automáticamente con rol `student` → (6) Es redirigido al dashboard de estudiante → (7) Ve sus métricas iniciales en cero y el catálogo de retos disponibles |
| **CU asociados** | CU-01, CU-02, CU-03, CU-04 |
| **Criterio de aceptación** | El estudiante accede exitosamente en su primer intento, ve su dashboard personal con métricas en cero, y puede visualizar los laboratorios disponibles sin necesidad de asistencia ni manual previo |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-02: Flujo completo de práctica con ejecución de código

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-02 |
| **Prioridad** | Crítico |
| **Actor** | Estudiante registrado |
| **Precondición** | El estudiante ha iniciado sesión y existen al menos 2 laboratorios con test cases creados por un docente |
| **Flujo de negocio** | (1) El estudiante accede al catálogo de retos → (2) Selecciona un laboratorio de dificultad "fácil" → (3) Lee el enunciado y los test cases visibles → (4) Escribe código C++ en el editor Monaco → (5) Presiona "Ejecutar" → (6) Ve la salida de su programa en la consola → (7) Corrige errores si los hay → (8) Presiona "Evaluar" para verificar contra los test cases → (9) Ve el resultado de cada test case (✅/❌) → (10) Ajusta su código hasta obtener ✅ APROBADO en todos |
| **CU asociados** | CU-04, CU-05, CU-06 |
| **Criterio de aceptación** | El estudiante completa el flujo de selección → escritura → ejecución → evaluación sin interrupciones técnicas. El resultado de los test cases refleja correctamente si el código es correcto o incorrecto. La salida del compilador es clara ante errores |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-03: Interacción completa con el tutor socrático de IA

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-03 |
| **Prioridad** | Crítico |
| **Actor** | Estudiante registrado |
| **Precondición** | El estudiante está trabajando en un laboratorio, tiene código escrito con errores, y la IA está configurada por el administrador (CU-24) |
| **Flujo de negocio** | (1) El estudiante tiene código con errores de lógica → (2) Presiona "Pedir ayuda al tutor" → (3) Escribe su duda: "¿Por qué mi programa no da el resultado correcto?" → (4) El tutor IA responde con preguntas reflexivas (método socrático), sin dar la respuesta directa → (5) El estudiante reflexiona y modifica su código → (6) Califica la respuesta del tutor con 👍 (útil) → (7) La calificación se registra exitosamente |
| **CU asociados** | CU-07, CU-08 |
| **Criterio de aceptación** | El tutor IA responde en ≤ 5 segundos (RNF-02) con preguntas reflexivas, no con respuestas directas. La respuesta es relevante al código y al contexto del laboratorio. La calificación del tutor se registra correctamente. El estudiante percibe la interacción como útil para su aprendizaje |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-04: Consulta de progreso personal e historial

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-04 |
| **Prioridad** | Normal |
| **Actor** | Estudiante con actividad previa (al menos 5 intentos realizados) |
| **Precondición** | El estudiante ha realizado múltiples intentos en diferentes laboratorios, algunos exitosos y otros fallidos |
| **Flujo de negocio** | (1) El estudiante accede a su dashboard → (2) Ve sus métricas actualizadas: laboratorios disponibles, horas de práctica, pistas de IA usadas, total de intentos y último laboratorio practicado → (3) Navega al historial de intentos → (4) Ve los últimos 10 intentos con el estado de cada uno (✅/❌), si usó IA, y la fecha → (5) Verifica que los datos coinciden con su experiencia real de uso |
| **CU asociados** | CU-03, CU-09 |
| **Criterio de aceptación** | Las métricas del dashboard son coherentes con la actividad real del estudiante. El historial muestra correctamente los intentos con su estado. Las horas de práctica se calculan como `intentos × 0.25`. Los datos son exclusivos del estudiante (no ve datos de otros) |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-05: Visualización de anuncios del docente

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-05 |
| **Prioridad** | Normal |
| **Actor** | Estudiante registrado |
| **Precondición** | Al menos 2 anuncios han sido publicados por docentes |
| **Flujo de negocio** | (1) El estudiante accede a la sección de anuncios → (2) Ve los últimos 5 anuncios publicados con título, contenido y fecha → (3) Los anuncios están ordenados del más reciente al más antiguo → (4) El estudiante lee el contenido completo de un anuncio → (5) Verifica que no tiene opción de editar ni eliminar anuncios |
| **CU asociados** | CU-10 |
| **Criterio de aceptación** | Los anuncios se muestran correctamente con toda su información. El estudiante solo tiene acceso de lectura. El orden cronológico es correcto. La información es útil y comprensible |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-06: Rechazo de acceso con correo no autorizado

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-06 |
| **Prioridad** | Crítico |
| **Actor** | Persona externa a la universidad |
| **Precondición** | La persona tiene un correo @gmail.com que NO está en la Lista Blanca |
| **Flujo de negocio** | (1) La persona accede a la URL de ALDA → (2) Hace clic en "Iniciar sesión con Google" → (3) Selecciona su cuenta @gmail.com → (4) El sistema verifica el dominio → (5) Muestra mensaje "Solo correos institucionales o autorizados están permitidos" → (6) No se permite el acceso ni se crea cuenta |
| **CU asociados** | CU-01, CU-02 |
| **RNF asociado** | RNF-01 |
| **Criterio de aceptación** | El sistema rechaza el acceso al 100% de los intentos con correos no institucionales ni autorizados. El mensaje de error es claro y no expone información técnica. No se crea registro en la base de datos |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-07: Práctica libre sin laboratorio específico

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-07 |
| **Prioridad** | Normal |
| **Actor** | Estudiante registrado |
| **Precondición** | El estudiante ha iniciado sesión |
| **Flujo de negocio** | (1) El estudiante accede a la "Sala de Práctica Libre" → (2) Selecciona un lenguaje de programación (Python) → (3) Escribe código exploratorio sin contexto de laboratorio → (4) Ejecuta el código y ve la salida → (5) Consulta al tutor IA con una duda general → (6) El tutor responde con base en la base de conocimiento general → (7) El intento se registra con `laboratory_id=null` en el historial |
| **CU asociados** | CU-05, CU-07, CU-09 |
| **Criterio de aceptación** | El estudiante puede escribir y ejecutar código libremente sin necesidad de seleccionar un laboratorio. El tutor IA responde consultas generales. La actividad se registra en el historial como "Sala de Práctica Libre" |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-08: Ejecución de código en múltiples lenguajes

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-08 |
| **Prioridad** | Normal |
| **Actor** | Estudiante registrado |
| **Precondición** | El estudiante ha iniciado sesión y tiene acceso al editor |
| **Flujo de negocio** | (1) El estudiante escribe y ejecuta un programa en C++ → (2) Cambia el lenguaje a Python y ejecuta otro programa → (3) Cambia a Java y ejecuta → (4) Cambia a JavaScript y ejecuta → (5) En cada caso, la salida es correcta y se muestra en la consola |
| **CU asociados** | CU-05 |
| **Criterio de aceptación** | Los 4 lenguajes (C++, Python, Java, JavaScript) ejecutan correctamente. El cambio de lenguaje es fluido y no requiere recargar la página. La salida es correcta en cada caso. El tiempo de respuesta es < 2 segundos (RNF-03) |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

### Rol 2 — Docente

#### Escenario UAT-09: Creación completa de laboratorio con casos de prueba

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-09 |
| **Prioridad** | Crítico |
| **Actor** | Docente registrado |
| **Precondición** | El docente ha iniciado sesión con una cuenta que tiene rol `teacher` |
| **Flujo de negocio** | (1) El docente accede al panel de gestión de laboratorios → (2) Presiona "Crear nuevo laboratorio" → (3) Llena el formulario: título "Ordenamiento Burbuja", descripción del enunciado, dificultad "medium", no es examen → (4) Agrega 3 test cases visibles con input/output esperado (evaluación exacta) → (5) Agrega 2 test cases ocultos para evaluación anti-copia → (6) Presiona "Crear" → (7) El laboratorio aparece inmediatamente en su lista y en el catálogo de estudiantes (CU-04) → (8) Los test cases ocultos no son visibles para los estudiantes |
| **CU asociados** | CU-13, CU-04 |
| **Criterio de aceptación** | El laboratorio se crea correctamente con todos sus test cases. Los test cases ocultos no son visibles para estudiantes pero sí se ejecutan en la evaluación. El laboratorio aparece en el catálogo del estudiante con la información correcta |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-10: Monitoreo del rendimiento de la clase

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-10 |
| **Prioridad** | Crítico |
| **Actor** | Docente registrado |
| **Precondición** | Al menos 5 estudiantes han realizado intentos en laboratorios, algunos con asistencia de IA y otros sin ella |
| **Flujo de negocio** | (1) El docente accede a su dashboard de estadísticas → (2) Ve el total de estudiantes registrados, total de laboratorios, total de intentos y tasa de independencia → (3) Navega al análisis de errores frecuentes → (4) Ve la clasificación automática de errores por categoría (sintaxis, punteros, lógica, etc.) → (5) Identifica los errores más comunes de su clase → (6) Ve el top 5 de estudiantes con más dificultades → (7) Revisa el desglose de errores por laboratorio para saber cuáles generan más problemas |
| **CU asociados** | CU-11, CU-12 |
| **Criterio de aceptación** | Las estadísticas son precisas y reflejan los datos reales de la plataforma. La tasa de independencia se calcula correctamente. La clasificación de errores es coherente con los tipos de fallos reales. El docente puede identificar patrones y tomar decisiones pedagógicas basadas en los datos |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-11: Gestión de contenido académico (anuncios)

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-11 |
| **Prioridad** | Normal |
| **Actor** | Docente registrado |
| **Precondición** | El docente ha iniciado sesión |
| **Flujo de negocio** | (1) El docente accede a la sección de anuncios → (2) Crea un nuevo anuncio con título "Examen parcial próxima semana" y contenido detallado → (3) Publica el anuncio → (4) Verifica que aparece como el más reciente en la lista → (5) Un estudiante confirma que puede ver el anuncio en su interfaz (CU-10) → (6) El docente decide eliminar un anuncio antiguo → (7) Confirma la eliminación → (8) El anuncio desaparece tanto de su vista como de la vista de los estudiantes |
| **CU asociados** | CU-15, CU-16, CU-10 |
| **Criterio de aceptación** | El anuncio se publica inmediatamente y es visible para los estudiantes. La eliminación es efectiva e inmediata. El docente solo puede eliminar sus propios anuncios. El contenido del anuncio se muestra completo sin truncamiento |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-12: Carga de material pedagógico para la IA

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-12 |
| **Prioridad** | Crítico |
| **Actor** | Docente registrado |
| **Precondición** | El docente tiene material académico (un PDF de apuntes y un texto sobre estructuras de datos) preparado |
| **Flujo de negocio** | (1) El docente accede a la sección de base de conocimiento → (2) Sube un texto titulado "Conceptos de punteros en C++" con contenido académico → (3) El sistema confirma la indexación y muestra la cantidad de chunks creados → (4) Sube un archivo PDF de 5 páginas sobre "Estructuras de datos" → (5) El sistema extrae el texto, lo indexa y muestra un preview de 500 caracteres → (6) Un estudiante consulta al tutor IA sobre punteros → (7) El tutor incluye conceptos del material recién subido en su respuesta socrática → (8) El docente elimina el material de texto → (9) Verifica que el tutor ya no usa ese material en futuras respuestas |
| **CU asociados** | CU-17, CU-18, CU-07 |
| **Criterio de aceptación** | El material se indexa correctamente y el tutor IA lo utiliza en sus respuestas. La eliminación del material se refleja en las respuestas del tutor. Los PDFs se procesan sin errores y el preview es informativo. La interacción completa es intuitiva para el docente |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-13: Generación y descarga de reporte de calificaciones

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-13 |
| **Prioridad** | Crítico |
| **Actor** | Docente registrado |
| **Precondición** | Al menos 10 estudiantes han realizado intentos en al menos 3 laboratorios diferentes |
| **Flujo de negocio** | (1) El docente accede a la función de reportes → (2) Presiona "Exportar reporte" → (3) Se descarga un archivo `ALDA_Reporte_2026-09-05.xlsx` → (4) Abre el archivo en Excel → (5) Verifica la hoja "Intentos Detallados": ve columnas de Estudiante, Correo, Laboratorio, N° Intento, Usó IA, Aprobado, Calificación IA, Fecha → (6) Verifica la hoja "Por Laboratorio": ve Laboratorio, Total Intentos, Con IA, Aprobados, Tasa de Éxito % → (7) Valida que los datos del reporte coinciden con lo que observa en el dashboard → (8) Los datos son útiles para asignar calificaciones |
| **CU asociados** | CU-19 |
| **Criterio de aceptación** | El archivo Excel se descarga sin errores y se abre correctamente. Las dos hojas contienen la estructura y datos esperados. Los datos son precisos y coinciden con las estadísticas del dashboard. El nombre del archivo incluye la fecha actual. El formato es profesional y listo para uso académico |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-14: Eliminación de laboratorio propio y efecto en cascada

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-14 |
| **Prioridad** | Normal |
| **Actor** | Docente registrado |
| **Precondición** | El docente tiene un laboratorio creado con test cases e intentos de estudiantes asociados |
| **Flujo de negocio** | (1) El docente accede a su lista de laboratorios → (2) Selecciona un laboratorio para eliminar → (3) El sistema muestra confirmación de eliminación irreversible → (4) El docente confirma → (5) El laboratorio desaparece de su lista y del catálogo de estudiantes → (6) Los test cases e intentos asociados se eliminan en cascada → (7) Las estadísticas del dashboard se actualizan correctamente |
| **CU asociados** | CU-14 |
| **Criterio de aceptación** | La eliminación es completa (laboratorio + test cases + intentos). El catálogo de estudiantes se actualiza. Las estadísticas reflejan la eliminación. El docente solo puede eliminar sus propios laboratorios. La acción es irreversible y el sistema lo comunica claramente |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

### Rol 3 — Administrador

#### Escenario UAT-15: Configuración inicial de la plataforma

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-15 |
| **Prioridad** | Crítico |
| **Actor** | Administrador del sistema |
| **Precondición** | El sistema está recién desplegado y el administrador tiene acceso con rol `admin` |
| **Flujo de negocio** | (1) El admin inicia sesión → (2) Accede al panel de configuración de IA → (3) Ingresa la API key de Google Gemini → (4) Selecciona el modelo `gemini-2.5-flash` → (5) Guarda la configuración → (6) Accede a la gestión de Lista Blanca → (7) Agrega correos de docentes externos invitados → (8) Verifica que los correos agregados pueden acceder a la plataforma → (9) Verifica que un estudiante puede consultar al tutor IA con la configuración aplicada |
| **CU asociados** | CU-24, CU-23, CU-01, CU-07 |
| **Criterio de aceptación** | La configuración de IA se persiste correctamente y el tutor funciona con la API key configurada. Los correos de la Lista Blanca pueden acceder sin ser institucionales. Los cambios son de efecto inmediato sin reiniciar el sistema. La interfaz de configuración es clara y no requiere conocimientos técnicos avanzados |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-16: Monitoreo del estado general de la plataforma

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-16 |
| **Prioridad** | Normal |
| **Actor** | Administrador del sistema |
| **Precondición** | La plataforma tiene actividad registrada (usuarios, compilaciones, consultas IA) |
| **Flujo de negocio** | (1) El admin accede al dashboard de administración → (2) Ve las métricas generales: total de usuarios, compilaciones, consultas IA, llamadas del día, modelo activo y tokens estimados → (3) Revisa los logs de auditoría con los últimos 50 eventos → (4) Identifica actividad inusual o patrones de uso → (5) Verifica que los logs incluyen compilaciones, consultas IA e inicios de sesión con detalle suficiente |
| **CU asociados** | CU-20 |
| **Criterio de aceptación** | Las métricas son precisas y se actualizan en tiempo real. Los logs muestran suficiente detalle para auditoría. El dashboard permite al administrador tener visibilidad completa del estado de la plataforma. Los tokens estimados se calculan correctamente (consultas × 800) |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-17: Gestión de usuarios (roles y accesos)

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-17 |
| **Prioridad** | Crítico |
| **Actor** | Administrador del sistema |
| **Precondición** | Existen al menos 5 usuarios con rol `student` y 1 con rol `teacher` |
| **Flujo de negocio** | (1) El admin accede a la gestión de usuarios → (2) Selecciona un estudiante y cambia su rol a `teacher` → (3) El estudiante cierra sesión y vuelve a ingresar → (4) Ahora ve el dashboard de docente con funcionalidades de gestión → (5) El admin selecciona un usuario problemático y lo suspende (`is_active=false`) → (6) El usuario suspendido intenta ingresar y ve pantalla de "cuenta suspendida" → (7) El admin reactiva al usuario → (8) El usuario puede acceder nuevamente con normalidad |
| **CU asociados** | CU-21, CU-22, CU-01 |
| **Criterio de aceptación** | El cambio de rol es efectivo en la siguiente sesión del usuario. La suspensión impide el acceso inmediatamente. La reactivación restaura el acceso con el mismo rol y datos. El admin no puede auto-suspenderse. Los cambios se reflejan en el dashboard de administración |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-18: Gestión de Lista Blanca de correos autorizados

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-18 |
| **Prioridad** | Normal |
| **Actor** | Administrador del sistema |
| **Precondición** | El admin ha iniciado sesión |
| **Flujo de negocio** | (1) El admin accede a la gestión de Lista Blanca → (2) Ve la tabla actual de correos autorizados → (3) Agrega un correo externo `docente.invitado@gmail.com` con nota "Docente invitado del taller de IA" → (4) Verifica que el correo aparece en la lista normalizado a minúsculas → (5) El docente invitado intenta acceder con su correo y logra ingresar → (6) Meses después, el admin elimina el correo de la Lista Blanca → (7) El docente invitado intenta ingresar nuevamente y el acceso es rechazado |
| **CU asociados** | CU-23, CU-01, CU-02 |
| **Criterio de aceptación** | La Lista Blanca funciona como bypass del dominio institucional. La normalización a minúsculas previene duplicados. La eliminación revoca el acceso de forma inmediata. La nota descriptiva ayuda a documentar el motivo del acceso autorizado |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

### Escenarios Transversales (Multi-Rol)

#### Escenario UAT-19: Flujo end-to-end completo del ciclo académico

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-19 |
| **Prioridad** | Crítico |
| **Actor** | Administrador → Docente → Estudiante (los 3 roles en secuencia) |
| **Precondición** | La plataforma está desplegada y operativa con la configuración de IA activa |
| **Flujo de negocio** | **(Admin)** (1) Configura la API key de IA y agrega correos a la Lista Blanca → **(Docente)** (2) Inicia sesión → (3) Sube material pedagógico sobre "Punteros en C++" → (4) Crea un laboratorio "Suma de arrays" con 5 test cases (3 visibles, 2 ocultos) → (5) Publica un anuncio "Nuevo reto disponible" → **(Estudiante)** (6) Inicia sesión por primera vez → (7) Ve el anuncio del docente → (8) Accede al catálogo y selecciona el laboratorio → (9) Escribe código, ejecuta, obtiene errores → (10) Consulta al tutor IA, recibe guía socrática basada en el material del docente → (11) Corrige su código y evalúa contra test cases → (12) Obtiene ✅ APROBADO → (13) Califica la respuesta del tutor → **(Docente)** (14) Ve la actividad del estudiante en su dashboard → (15) Descarga reporte Excel con los resultados → **(Admin)** (16) Ve las métricas actualizadas en el panel de administración |
| **CU asociados** | CU-24, CU-17, CU-13, CU-15, CU-01, CU-10, CU-04, CU-05, CU-07, CU-06, CU-08, CU-11, CU-19, CU-20 |
| **RNF asociados** | RNF-01, RNF-02, RNF-03, RNF-06, RNF-07, RNF-08 |
| **Criterio de aceptación** | El flujo completo se ejecuta sin interrupciones desde la configuración del admin hasta la generación del reporte del docente. Cada rol experimenta su funcionalidad correctamente. Los datos fluyen coherentemente entre los tres roles. El tiempo total del flujo es razonable (< 15 minutos) |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-20: Aislamiento de datos y permisos entre roles

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-20 |
| **Prioridad** | Crítico |
| **Actor** | Estudiante, Docente y Administrador (prueba simultánea) |
| **Precondición** | Los 3 usuarios han iniciado sesión en navegadores diferentes |
| **Flujo de negocio** | (1) El estudiante verifica que NO puede acceder a endpoints de docente (estadísticas, crear laboratorio, reportes) → (2) El estudiante verifica que NO puede acceder a endpoints de admin (gestión de usuarios, configuración, logs) → (3) El docente verifica que NO puede acceder a endpoints de admin → (4) El docente verifica que NO puede eliminar laboratorios de otro docente → (5) El estudiante verifica que NO puede ver el progreso de otro estudiante → (6) El administrador confirma que puede acceder a todas las funcionalidades |
| **CU asociados** | CU-01 a CU-24 |
| **RNF asociado** | RNF-01, RNF-08 |
| **Criterio de aceptación** | Cada rol accede exclusivamente a las funcionalidades que le corresponden. Los intentos de acceso no autorizado son rechazados con mensajes claros. No hay fugas de datos entre roles. El administrador tiene acceso completo |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-21: Rendimiento percibido por el usuario

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-21 |
| **Prioridad** | Normal |
| **Actor** | Estudiante y Docente (evaluación subjetiva) |
| **Precondición** | Los usuarios han completado al menos 3 escenarios UAT previos |
| **Flujo de negocio** | (1) El estudiante ejecuta 5 programas diferentes y evalúa subjetivamente si la velocidad de respuesta es "aceptable" → (2) El estudiante consulta al tutor IA 3 veces y evalúa si el tiempo de espera es "tolerable" → (3) El docente genera un reporte y evalúa el tiempo de descarga → (4) Ambos usuarios responden un cuestionario breve: "¿La plataforma se siente rápida?", "¿Experimentó demoras frustrantes?", "¿El tutor IA responde en un tiempo razonable?" |
| **CU asociados** | CU-05, CU-07, CU-19 |
| **RNF asociados** | RNF-02, RNF-03, RNF-06 |
| **Criterio de aceptación** | Al menos el 80% de las respuestas al cuestionario son positivas ("Sí" / "De acuerdo"). Ningún usuario reporta demoras frustrantes que interrumpan su flujo de trabajo. La percepción general de velocidad es satisfactoria |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

#### Escenario UAT-22: Compatibilidad con navegadores del laboratorio de cómputo

| Aspecto | Detalle |
| :--- | :--- |
| **ID** | UAT-22 |
| **Prioridad** | Normal |
| **Actor** | Estudiante y Docente |
| **Precondición** | Se dispone de equipos del laboratorio de cómputo de la universidad con los navegadores instalados |
| **Flujo de negocio** | (1) En Google Chrome: el estudiante completa el flujo de práctica completo (login → editar código → ejecutar → evaluar → consultar tutor) → (2) En Mozilla Firefox: repite el mismo flujo → (3) En Microsoft Edge: repite el mismo flujo → (4) En cada navegador se verifica: el editor Monaco funciona correctamente, la consola muestra salidas, la descarga de reportes funciona, y no se requieren plugins adicionales |
| **CU asociados** | CU-01, CU-05, CU-06, CU-07, CU-19 |
| **RNF asociado** | RNF-05 |
| **Criterio de aceptación** | Todas las funcionalidades operan correctamente en las últimas 2 versiones de Chrome, Firefox y Edge. No se requieren plugins, extensiones ni configuraciones especiales. La apariencia visual es consistente entre navegadores |
| **Resultado** | ☐ Aprobado ☐ Rechazado |
| **Observaciones** | |

---

### Resumen General del Plan de Pruebas de Aceptación

| Rol / Categoría | Escenarios | Críticos | Normales |
| :--- | :---: | :---: | :---: |
| Estudiante (UAT-01 a UAT-08) | 8 | 3 | 5 |
| Docente (UAT-09 a UAT-14) | 6 | 4 | 2 |
| Administrador (UAT-15 a UAT-18) | 4 | 2 | 2 |
| Transversales Multi-Rol (UAT-19 a UAT-22) | 4 | 2 | 2 |
| **TOTAL** | **22** | **11** | **11** |

---

### Matriz de Trazabilidad UAT ↔ Casos de Uso ↔ RNF

| Escenario UAT | Casos de Uso Cubiertos | RNF Verificados |
| :--- | :--- | :--- |
| UAT-01 | CU-01, CU-02, CU-03, CU-04 | RNF-01 |
| UAT-02 | CU-04, CU-05, CU-06 | RNF-03 |
| UAT-03 | CU-07, CU-08 | RNF-02 |
| UAT-04 | CU-03, CU-09 | — |
| UAT-05 | CU-10 | — |
| UAT-06 | CU-01, CU-02 | RNF-01 |
| UAT-07 | CU-05, CU-07, CU-09 | RNF-03 |
| UAT-08 | CU-05 | RNF-03 |
| UAT-09 | CU-13, CU-04 | — |
| UAT-10 | CU-11, CU-12 | RNF-07 |
| UAT-11 | CU-15, CU-16, CU-10 | — |
| UAT-12 | CU-17, CU-18, CU-07 | RNF-02 |
| UAT-13 | CU-19 | — |
| UAT-14 | CU-14 | — |
| UAT-15 | CU-24, CU-23, CU-01, CU-07 | RNF-01 |
| UAT-16 | CU-20 | — |
| UAT-17 | CU-21, CU-22, CU-01 | RNF-01 |
| UAT-18 | CU-23, CU-01, CU-02 | RNF-01 |
| UAT-19 | CU-01, CU-04 a CU-08, CU-10, CU-11, CU-13, CU-15, CU-17, CU-19, CU-20, CU-24 | RNF-01, RNF-02, RNF-03, RNF-06, RNF-07, RNF-08 |
| UAT-20 | CU-01 a CU-24 | RNF-01, RNF-08 |
| UAT-21 | CU-05, CU-07, CU-19 | RNF-02, RNF-03, RNF-06 |
| UAT-22 | CU-01, CU-05, CU-06, CU-07, CU-19 | RNF-05 |

**Cobertura total:** Los 24 casos de uso (CU-01 a CU-24) y los 8 requerimientos no funcionales (RNF-01 a RNF-08) están cubiertos por al menos un escenario UAT.

---

### Formato del Acta de Aceptación

Al finalizar la ejecución de todos los escenarios UAT, se completará el siguiente acta:

| Campo | Detalle |
| :--- | :--- |
| **Fecha de ejecución** | ____/____/________ |
| **Escenarios ejecutados** | ______ de 22 |
| **Escenarios aprobados** | ______ de 22 |
| **Escenarios rechazados** | ______ de 22 |
| **Defectos críticos encontrados** | ______ |
| **Defectos resueltos** | ______ |
| **Decisión** | ☐ **ACEPTADO** — El sistema cumple con las necesidades del negocio y está listo para producción ☐ **ACEPTADO CON OBSERVACIONES** — El sistema es aceptable pero requiere correcciones menores antes del despliegue ☐ **RECHAZADO** — El sistema no cumple con los criterios mínimos de aceptación |
| **Firma del líder funcional** | _________________________________ |
| **Firma del responsable de QA** | _________________________________ |
| **Firma del responsable técnico** | _________________________________ |