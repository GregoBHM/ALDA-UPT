✔ Prueba de Integración
Descripción: Se verificó la correcta integración entre el flujo de autenticación OAuth y la validación de estado del usuario en la base de datos. El sistema debe garantizar que el estado `is_active` sea evaluado de manera integral durante el inicio de sesión, impidiendo el acceso a los usuarios suspendidos incluso si proporcionan un token de acceso de Google válido y correctamente firmado.

Componentes integrados:
- Módulo de Autenticación OAuth (Endpoint de `/login`).
- Módulo de Gestión de Usuarios y Base de datos (Validación del campo `is_active`).

Escenarios de Integración Evaluados (Automatizados):
- **Login con cuenta suspendida:** Un usuario cuyo estado en base de datos es inactivo (`is_active = False`) envía una petición de login con un token OAuth válido. Se espera que el flujo sea interrumpido y se devuelva un error de acceso denegado.
- **Login con cuenta activa:** Un usuario con estado normal en la base de datos realiza el mismo procedimiento, esperando que la sesión sea creada correctamente.

Resultado: Éxito.
- El usuario suspendido fue bloqueado exitosamente antes de crear la sesión, retornando un error `HTTP 403 Forbidden` con el mensaje `BANNED_USER`.
- El usuario activo pudo completar todo el proceso de autenticación e ingresar de manera exitosa.

Evidencia (salida CLI):

Gráfico 01. Ejecución de Pruebas de Integración: CP-109 - Integración Suspensión con Flujo de Login

Fuente: Elaboración propia. 2026

Nota: Se empleó `FastAPI TestClient` para ejecutar el caso de prueba. El resultado confirma que la capa de seguridad funciona correctamente a nivel de integración: no existen vulnerabilidades que permitan evadir el estado de cuenta suspendida apoyándose exclusivamente en la validez del token del proveedor externo (Google).
