✔ Prueba Funcional

Tipo: Manual

Pasos ejecutados:
1. Inicio de sesión como administrador con credenciales válidas.
2. Navegación al panel de gestión y localización de la cuenta del usuario de prueba.
3. Ejecución del flujo de "Cambio de Rol" mediante la interfaz, seleccionando y asignando un nuevo rol al usuario.
4. Intento de ejecución de una acción restringida (ej. crear laboratorio) desde la cuenta del usuario modificado, sin recargar la página, para comprobar la revocación inmediata.
5. Recarga de la página en el navegador del usuario para confirmar la actualización completa de las vistas correspondientes a su nuevo rol.

Resultado esperado: El administrador debe poder modificar el rol de los usuarios directamente desde la interfaz gráfica. El Backend debe actualizar los permisos en tiempo real, bloqueando acciones no autorizadas inmediatamente, y la interfaz del Frontend debe adaptarse a los nuevos privilegios al recargar.

Resultado obtenido: Éxito. El rol se actualizó correctamente. El Backend revocó los permisos en tiempo real, arrojando un mensaje de error cuando el usuario intentó realizar una acción no permitida sin recargar. Tras actualizar la página, la interfaz del usuario se sincronizó de forma segura con las vistas de su nuevo rol.

Evidencia:

![Cambio de rol en el panel de gestión](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-102part1.png)

Gráfico 01. Cambio de rol desde el panel de gestión (CP-102, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se evidencia la interacción del administrador asignando un nuevo rol al usuario desde la interfaz de gestión de usuarios.

---

![Bloqueo de permisos en tiempo real](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-102part2.png)

Gráfico 02. Bloqueo de permisos en tiempo real (CP-102, Parte 2)

Fuente: Elaboración propia. 2026

Nota: El sistema arroja un mensaje de alerta bloqueando la acción al intentar utilizar una funcionalidad que ya no le corresponde a su nuevo rol. Esto demuestra la eficacia de la revocación de permisos inmediata a nivel del Backend.

---

![Sincronización de interfaz tras recarga](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-102part3.png)

Gráfico 03. Sincronización de la interfaz tras recarga (CP-102, Parte 3)

Fuente: Elaboración propia. 2026

Nota: Al recargar la página, el Frontend actualiza automáticamente los componentes y la navegación, sincronizándose de manera íntegra y segura con el nuevo rol asignado al usuario.
