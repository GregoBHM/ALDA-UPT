✔ Prueba de Aceptación
Escenario validado: Se intentó acceder a las herramientas de gestión de usuarios para cambiar el rol de un usuario utilizando cuentas con permisos inferiores (Docente y Estudiante). El objetivo es confirmar que la funcionalidad está estrictamente reservada para el rol de Administrador.
Resultado: El sistema denegó el acceso correctamente. La interfaz gráfica no expuso las rutas ni las opciones en el menú lateral para los roles de Docente y Estudiante. Además, al intentar forzar la navegación ingresando la URL directa de la vista de gestión, el sistema redirigió de manera automática y segura al dashboard principal del usuario.
Validación del usuario/cliente: El sistema cumple satisfactoriamente con el requerimiento de seguridad establecido, garantizando que la modificación de roles sea una capacidad exclusiva del Administrador y previniendo efectivamente cualquier intento de escalado de privilegios.

Evidencia:

![Ocultamiento de rutas en el menú](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-103%20parte1.png)

Gráfico 01. Interfaz de usuario con rol no autorizado (CP-103, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se evidencia que la interfaz correspondiente a un usuario con rol inferior (Docente o Estudiante) oculta por diseño las herramientas de administración, no exponiendo ninguna ruta relacionada a la gestión de roles de usuario.

---

![Redirección automática por seguridad](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-103%20parte2.png)

Gráfico 02. Bloqueo y redirección al intentar forzar el acceso (CP-103, Parte 2)

Fuente: Elaboración propia. 2026

Nota: Al forzar el acceso mediante la introducción manual de la ruta de gestión en la URL, la capa de seguridad del Frontend detecta la insuficiencia de permisos y responde ejecutando una redirección inmediata al dashboard del usuario, evitando así cualquier brecha de seguridad.
