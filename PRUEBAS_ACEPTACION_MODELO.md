# CASO DE PRUEBA

**Fecha:** 24/03/2025

| Campo | Detalle |
|---|---|
| **Caso de uso** | RF-002 – Gestionar Usuario |
| **Caso N°** | CPA-01 |
| **Versión de ejecución** | v2.0 |
| **Fecha de ejecución** | 26/03/2025 – 20:24 p.m. |
| **Módulo del sistema** | Gestión de Usuarios |
| **Descripción del caso** | Validar que el Administrador pueda editar los datos de un usuario desde el panel de administración y que los cambios se reflejen correctamente tanto en la interfaz como en la base de datos. |

---

## 7. Caso de Prueba

**Tipo de prueba:** Aceptación

### a. Precondiciones que deben cumplirse para realizar la prueba

- Un usuario administrador debe estar activo en la base de datos.
- Acceso al panel de administración del sistema en el entorno de pruebas.
- Debe existir un usuario registrado previamente en el sistema que pueda ser editado.
- La interfaz de usuario debe permitir la edición de campos específicos del usuario, como nombre, correo y rol.

### b. Pasos secuenciales para poder ejecutar

Representa la secuencia de pasos que deberán ser ejecutados para verificar el caso de prueba.

#### Flujo Normal: Edición de Usuario por Administrador

| N° | Pasos | Resultado esperado |
|---|---|---|
| 1 | El administrador inicia sesión en el panel de administración con credenciales válidas. | El administrador puede acceder al panel sin problemas. |
| 2 | El administrador navega a la sección de gestión de usuarios y selecciona un usuario existente para editar. | El sistema muestra la lista de usuarios registrados, con la opción de editar datos. |
| 3 | Se verifican los datos iniciales del usuario (correo, nombre, rol) en la interfaz antes de la edición. | Los datos iniciales del usuario deben ser visibles y correctos en la interfaz antes de la edición. |
| 4 | El administrador edita los campos de datos del usuario, como: nombre, correo (debe ser válido) y rol. | Los campos editados deben estar disponibles para su actualización en la interfaz. El sistema debe permitir la modificación de los valores. |
| 5 | Después de realizar los cambios, el administrador hace clic en el botón de guardar cambios para aplicar las modificaciones. | El sistema guarda correctamente los cambios realizados en los campos editados. |
| 6 | El administrador verifica que los cambios realizados se reflejan correctamente en la interfaz de usuario (listado de usuarios) después de la edición. | Los datos modificados deben reflejarse correctamente en la lista de usuarios del panel de administración. |
| 7 | El administrador verifica que los cambios se reflejan también en la base de datos para asegurarse de que la actualización se realizó correctamente. | Los cambios deben estar reflejados en la base de datos de manera precisa. |
| 8 | El administrador realiza una nueva consulta del usuario en la interfaz para asegurar que no haya afectado otros registros del sistema. | Los datos de otros usuarios no deben verse afectados por la edición realizada. |

#### Flujo Alternativo: Fallos en la Edición

| N° | Pasos | Resultado esperado |
|---|---|---|
| 7 | Si el correo electrónico introducido no tiene un formato válido (por ejemplo, `usuario@dominio` sin la extensión), el sistema debe rechazar la actualización. | El sistema muestra un mensaje de error indicando que el correo electrónico no es válido y no guarda el cambio. |
| 8 | Si se intenta editar el rol del usuario a un valor no válido (por ejemplo, "Gerente" cuando solo se permiten "Empleado" o "Administrador"), el sistema debe rechazar la actualización. | El sistema muestra un mensaje de error indicando que el rol no es válido y no guarda el cambio. |
| 9 | Si los datos no se guardan correctamente en la base de datos debido a un error técnico (por ejemplo, un problema con la conexión a la base de datos), el sistema debe mostrar un mensaje de error. | El sistema debe mostrar un mensaje de error y no reflejar los cambios en la interfaz ni en la base de datos. |

### c. Postcondiciones que deben cumplirse para la realización de la prueba

- Los cambios realizados en los campos editados del usuario deben reflejarse correctamente en el listado de usuarios de la interfaz de administración.
- Los datos del usuario editado deben estar correctamente actualizados en la base de datos, sin afectar otros registros de usuarios.
- Los **valores no válidos** (como correo o rol incorrecto) deben ser rechazados y el sistema debe mostrar un mensaje adecuado.

---

## 8. RESULTADOS DE LA PRUEBA

**Defectos y desviaciones encontradas en las pruebas:**
La prueba se realizó exitosamente sin encontrar errores o bugs en sus diferentes escenarios.

**Resultado (marcar x):**

- [x] Con éxito
- [ ] Paralizada
- [ ] Suspendida

| Observaciones generales | Responsable de prueba |
|---|---|
| Los cambios realizados en los campos editados (nombre, correo, rol) se reflejan correctamente tanto en la interfaz de usuario como en la base de datos. | **Firma:** *(firmado)*<br>**Nombre:** Luigi Nina Vargas<br>**Fecha:** 26/03/2025 |

---

*Confidential © EPS TACNA, 2025*
