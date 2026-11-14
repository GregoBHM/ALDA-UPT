✔ Prueba de Aceptación
Escenario validado: Se intentó acceder a la funcionalidad de carga de material pedagógico utilizando una cuenta con rol de Estudiante. El propósito es confirmar que la capacidad de aportar conocimiento a la base de la IA está estrictamente reservada para el rol Docente, evaluando las restricciones tanto en la interfaz de usuario como a nivel de Backend.
Resultado: El sistema denegó el acceso correctamente. Por un lado, la interfaz gráfica del Estudiante no expone ningún formulario, menú ni ruta de acceso para gestionar el material pedagógico. Por otro lado, al intentar forzar una petición directa (POST) al endpoint de subida utilizando el token del estudiante, el Backend interceptó y bloqueó la solicitud, retornando un error `HTTP 403 Forbidden`.
Validación del usuario/cliente: El sistema cumple satisfactoriamente con los controles de seguridad y políticas de acceso, garantizando que los estudiantes no puedan vulnerar la plataforma ni alterar la base de conocimiento que retroalimenta al tutor IA, salvaguardando así la integridad pedagógica de la herramienta.

Evidencia:

![Ocultamiento de opción de carga en el panel de estudiante](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-83parte1.png)

Gráfico 01. Interfaz de usuario con rol de Estudiante (CP-83, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se verifica visualmente que el entorno de navegación de una cuenta con rol de Estudiante omite deliberadamente el módulo de gestión de conocimiento. No existe ningún acceso visible para subir archivos PDF al sistema.

---

![Respuesta del servidor bloqueando el acceso a la API](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-83parte2.png)

Gráfico 02. Bloqueo de petición al Backend (Error 403 Forbidden) (CP-83, Parte 2)

Fuente: Elaboración propia. 2026

Nota: Al intentar vulnerar la restricción realizando una petición de subida de documento (POST) directamente hacia la API, utilizando el token de sesión del estudiante, el Backend ejerce la validación de roles y rechaza contundentemente la acción devolviendo un código 403.
