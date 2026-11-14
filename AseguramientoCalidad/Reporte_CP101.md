✔ Prueba Unitaria
Descripción: Se validó la lógica de asignación y cambio de roles de usuario, verificando que la función del backend encargada del proceso únicamente acepte los valores estrictamente definidos por el sistema (`student`, `teacher`, `admin`) y rechace cualquier otra entrada inválida para garantizar la consistencia en la base de datos.

Componente probado: Lógica de Negocio / Cambio de Rol de Usuario (Python).

Casos cubiertos (automatizados):
`test_roles_validos_aceptados[student, teacher, admin]`: Comprueba la aceptación correcta de los tres roles oficiales del sistema.
`test_roles_invalidos_rechazados[director, sudo, guest]`: Valida que el sistema rechace categóricamente, con un error `HTTP 400 Bad Request`, roles inexistentes, arbitrarios o potencialmente maliciosos.
`test_roles_invalidos_rechazados[vacíos y espacios]`: Asegura que el sistema no permita cadenas vacías o espacios en blanco como valores de rol válidos.

Resultado: Éxito (8 tests pasaron exitosamente en 0.55s).

Evidencia (salida CLI):

![Ejecución de Pruebas Unitarias CP-101](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-101.txt)

Gráfico 01. Ejecución de Pruebas Unitarias: CP-101 - Validación de Rol en Cambio

Fuente: Elaboración propia. 2026

Nota: Se valida el cumplimiento de las restricciones de la lógica de negocio mediante 8 casos de prueba automatizados utilizando Pytest. El resultado muestra el rechazo total de los 5 casos inválidos con error 400, y la aceptación exclusiva de los 3 roles definidos, confirmando que la seguridad en el cambio de roles opera exitosamente.
