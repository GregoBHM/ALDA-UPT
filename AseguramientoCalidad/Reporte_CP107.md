✔ Prueba Funcional

Tipo: Manual

Pasos ejecutados:
1. Inicio de sesión como administrador con credenciales válidas.
2. Navegación al panel de gestión y localización de la cuenta de usuario de prueba.
3. Ejecución del flujo de suspensión de cuenta mediante la interacción con la interfaz.
4. Cierre de sesión e intento de inicio de sesión con la cuenta del usuario suspendido, verificando la restricción de acceso.
5. Nuevo inicio de sesión como administrador para reactivar al usuario de prueba.
6. Intento de inicio de sesión con el usuario reactivado, comprobando la restauración del acceso al sistema.

Resultado esperado: El administrador debe poder suspender y reactivar usuarios desde la interfaz gráfica. Los usuarios suspendidos no deben poder iniciar sesión, y el sistema debe mostrar un mensaje de alerta claro; al reactivarlos, deben recuperar su acceso normal.

Resultado obtenido: Éxito. El sistema bloqueó exitosamente el acceso del usuario suspendido al hacer login, mostrando la alerta correspondiente en el Frontend. Asimismo, le permitió el ingreso sin problemas tras la reactivación por parte del administrador.

Evidencia:

![Suspensión de cuenta desde el panel de administrador](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-107parte1.png)

Gráfico 01. Suspensión de cuenta desde el panel de administrador (CP-107, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se evidencia la interacción manual del administrador en el panel de gestión al suspender a un usuario específico. El sistema procesa la solicitud y la interfaz refleja el nuevo estado inactivo.

---

![Bloqueo de acceso en el inicio de sesión](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-107parte2.png)

Gráfico 02. Bloqueo de acceso en el inicio de sesión para usuario suspendido (CP-107, Parte 2)

Fuente: Elaboración propia. 2026

Nota: El sistema restringe correctamente el acceso del usuario suspendido al intentar iniciar sesión, cumpliendo con el flujo esperado y mostrando el mensaje de alerta correspondiente en el Frontend.
