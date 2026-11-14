✔ Prueba de Aceptación
Escenario validado: Se intentó suspender el acceso de un usuario utilizando cuentas con roles inferiores (Estudiante y Docente), tanto mediante la interfaz gráfica como forzando la petición a través de la API (Swagger) con los tokens correspondientes, para confirmar que solo los administradores poseen dicho privilegio.
Resultado: El sistema denegó la acción correctamente; la interfaz no expuso las herramientas de gestión para los roles inferiores, y el Backend bloqueó las peticiones directas retornando un "Error 403 Forbidden", demostrando que la validación del JWT es efectiva.
Validación del usuario/cliente: El sistema cumple con el requerimiento de seguridad establecido, asegurando que la suspensión o reactivación de cuentas sea una función exclusiva del rol Administrador, protegiendo así la integridad de los accesos.

Evidencia:

![Intento de acceso a funcionalidad de suspensión](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-108parte1.png)

Gráfico 01. Intento de acceso a la funcionalidad de suspensión con rol no autorizado (CP-108, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se observa la sesión iniciada con un rol inferior (Estudiante/Docente), el cual carece de las opciones en la interfaz para gestionar o suspender a otros usuarios.

---

![Ejecución directa a la API con token no autorizado](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-108parte2.png)

Gráfico 02. Ejecución directa a la API mediante Swagger (CP-108, Parte 2)

Fuente: Elaboración propia. 2026

Nota: Al intentar vulnerar la seguridad enviando la petición directamente al Backend mediante la interfaz de Swagger, el sistema procesa la solicitud identificando el rol adjunto en el token JWT del usuario.

---

![Respuesta del Backend bloqueando la acción](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-108parte3.png)

Gráfico 03. Respuesta del servidor bloqueando la acción (Error 403 Forbidden) (CP-108, Parte 3)

Fuente: Elaboración propia. 2026

Nota: El Backend intercepta la acción no autorizada y la rechaza contundentemente con un código HTTP 403 Forbidden, confirmando que la protección de seguridad opera eficazmente a nivel de servidor sin depender exclusivamente del Frontend.
