✔ Prueba de Integración
Descripción: Se verificó la correcta integración del proceso de cambio de roles a nivel de API, asegurando que las transiciones entre los diferentes perfiles del sistema (`student`, `teacher`, `admin`) sean procesadas exitosamente por el Backend. Esto garantiza que el Frontend pueda consumir la respuesta y reflejar de manera confiable el nuevo conjunto de funcionalidades asociadas al usuario.

Componentes integrados:
- Módulo de Gestión de Usuarios (Endpoint PUT para actualización de roles).
- Base de datos (Actualización y persistencia del estado de rol).

Escenarios de Integración Evaluados (Automatizados):
- **Transición de Estudiante a Docente (`student -> teacher`):** Se envía una petición para escalar los permisos de un estudiante.
- **Transición de Docente a Administrador (`teacher -> admin`):** Se envía una petición para otorgar privilegios máximos a un docente.
- **Transición de Administrador a Estudiante (`admin -> student`):** Se envía una petición para revocar privilegios y degradar a un administrador al nivel base.

Resultado: Éxito.
- Todas las transiciones de rol fueron procesadas correctamente por la API.
- El endpoint devolvió un código de estado `HTTP 200 OK` en cada una de las pruebas, confirmando la actualización exitosa del rol en la base de datos.

Evidencia (salida CLI):

![Ejecución de Pruebas de Integración CP-104](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-104_Output.txt)

Gráfico 01. Ejecución de Pruebas de Integración: CP-104 - Integración de Cambio de Rol

Fuente: Elaboración propia. 2026

Nota: Se empleó `FastAPI TestClient` para ejecutar de manera automatizada las distintas transiciones de roles en el entorno local. El resultado confirma que el proceso de integración es robusto, devolviendo respuestas exitosas (`Status: 200`) en cada solicitud de cambio, validando así la correcta comunicación entre la API y la base de datos.
