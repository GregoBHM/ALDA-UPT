✔ Prueba Unitaria
Descripción: Se validó la lógica de gestión de estado de suspensión de usuarios, verificando que la función que suspende o reactiva un usuario actualice correctamente el campo `is_active` en la base de datos y que los intentos de login de usuarios suspendidos sean rechazados.

Componente probado: Servicio de Autenticación y Gestión de Usuarios (Python).

Casos cubiertos (automatizados):
`test_suspenderUsuario_debeActualizarIsActiveAFalse`: Verifica que al suspender se actualice el estado a inactivo en la base de datos.
`test_reactivarUsuario_debeActualizarIsActiveATrue`: Verifica la persistencia de la reactivación del usuario.
`test_loginUsuarioSuspendido_debeRetornarErrorBannedUser`: Comprueba que se rechace el login de un usuario suspendido con el error específico `BANNED_USER`.
`test_suspenderAdmin_noDebePermitirAutobloqueo`: Valida la protección para evitar que un administrador se bloquee a sí mismo.
`test_ciclosDeSuspension_debeMantenerConsistencia`: Comprueba los ciclos de suspensión y reactivación sucesivos.
`test_loginUsuarioReactivado_debeSerExitoso`: Verifica que un usuario reactivado recupere su acceso normal al sistema.

Resultado: Éxito (6 tests pasaron exitosamente en ~0.60s).

Evidencia (salida CLI):

Gráfico 01. Ejecución de Pruebas Unitarias: CP-106 - Suspender o reactivar acceso de un usuario

Fuente: Elaboración propia. 2026

Nota: Se valida el cumplimiento de la lógica de negocio mediante 6 casos de prueba automatizados en Pytest. El resultado muestra los tests exitosos confirmando que se actualiza el campo `is_active` correctamente, el mock de base de datos rechaza el login de usuarios suspendidos, y operan adecuadamente las protecciones adicionales como la restricción de auto-bloqueo del administrador.
