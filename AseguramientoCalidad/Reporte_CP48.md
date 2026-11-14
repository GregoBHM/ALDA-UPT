✔ Prueba de Aceptación
Escenario validado: Se intentó acceder a las herramientas de administración de anuncios (creación, edición y eliminación) utilizando una sesión con rol de Estudiante. El objetivo es confirmar que la capacidad de gestionar los comunicados de la plataforma esté estrictamente reservada para los docentes, validando las restricciones tanto en la interfaz de usuario como en los controles de acceso del sistema.
Resultado: El sistema denegó la acción correctamente. En el panel del estudiante no se exponen botones, formularios ni menús relacionados con la publicación o edición de anuncios. Adicionalmente, al intentar forzar la navegación hacia las rutas de gestión administrativa, el sistema interceptó la petición y bloqueó el acceso.
Validación del usuario/cliente: El sistema cumple satisfactoriamente con los requerimientos de seguridad, garantizando que el canal de anuncios oficiales no pueda ser manipulado por cuentas no autorizadas. Los estudiantes solo mantienen privilegios de lectura, previniendo así el envío de notificaciones falsas o no deseadas.

Evidencia:

![Interfaz de estudiante sin opciones de gestión](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-48parte1.png)

Gráfico 01. Interfaz del estudiante sin permisos de gestión (CP-48, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se verifica visualmente que la vista del estudiante (dashboard) oculta deliberadamente cualquier elemento de interfaz (botones, enlaces o formularios) orientado a la creación o modificación de anuncios, cumpliendo con la primera capa de seguridad.

---

![Bloqueo de acceso a la ruta de administración](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-48parte2.png)

Gráfico 02. Bloqueo de acceso a la ruta de administración de anuncios (CP-48, Parte 2)

Fuente: Elaboración propia. 2026

Nota: Al intentar vulnerar las restricciones accediendo directamente a las rutas reservadas para la administración de anuncios, el sistema valida la ausencia de los privilegios correspondientes al rol docente y bloquea exitosamente la solicitud.
