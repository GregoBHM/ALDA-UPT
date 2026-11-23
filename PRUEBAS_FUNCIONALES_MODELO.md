# Pruebas funcionales

> Conversión del PDF original a Markdown. Se conservan los datos, las tablas, los resultados y las capturas de evidencia. El archivo fuente incluye las páginas numeradas del 7 al 13.

## Caso de prueba CAP01 — CU01: Autenticar Usuarios

| Campo | Detalle |
|---|---|
| Caso N° | CAP01 |
| Caso de uso | CU01 — Autenticar Usuarios |
| Versión de ejecución | v2.0 |
| Fecha de ejecución | 19/04/2025 |
| Hora de ejecución | 8:00 a.m. |
| Módulo del sistema | Seguridad y Autenticación |

### Descripción de caso

Este caso de prueba verifica el proceso de autenticación de usuarios en el sistema. El objetivo es comprobar que un usuario pueda ingresar sus credenciales correctamente, que el sistema valide dichas credenciales y que, en caso de ser válidas, muestre el modal para ingresar el código de verificación enviado al correo electrónico.

### 1. Caso de Prueba

**Tipo de prueba:** Funcional.

#### a. Precondiciones que deben cumplir para realizar la prueba

1. El usuario debe estar registrado previamente en el sistema.
2. El sistema debe estar disponible y accesible en https://managementsystem.me/login.
3. El navegador debe tener JavaScript habilitado.
4. La conexión a internet debe estar activa.

#### b. Pasos secuenciales para poder ejecutar

Representa la secuencia de pasos que deberán ser ejecutadas para verificar el caso de Prueba.

##### Flujo Normal: Registrar un nuevo usuario

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión con los campos de email, contraseña, botón de ingreso y enlaces a recuperación y registro. |
| 2 | Ingresar el email "josue.200297@hotmail.com" en el campo correspondiente. | El campo acepta el texto ingresado. |
| 3 | Ingresar la contraseña "12345678" en el campo correspondiente. | El campo acepta el texto ingresado y lo oculta con asteriscos o puntos. |
| 4 | Hacer clic en el botón "Ingresar". | El sistema valida las credenciales y muestra el modal de verificación de código con un campo para ingresar el código de 6 dígitos y botones de "Verificar" y "Reenviar código". |

**Evidencias del flujo normal (página original 8):**

![Formulario de inicio de sesión](evidencias/01_inicio_sesion.png)

![Modal de verificación de correo](evidencias/02_modal_verificacion_correo.png)

##### Flujo Alternativo: Validación de campos vacíos

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión. |
| 2 | Hacer clic en el botón "Ingresar" sin completar ningún campo. | El sistema muestra mensajes de error indicando que los campos de email y contraseña son obligatorios. |

**Evidencia (página original 9):**

![Validación de campos vacíos](evidencias/03_validacion_campos_vacios.png)

##### Flujo Alternativo: Error en el campo email

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión. |
| 2 | Ingresar un texto con formato inválido (ej. "emailinvalido") en el campo de email. | El sistema acepta el texto ingresado. |
| 3 | Hacer clic fuera del campo de email o presionar Tab. | El sistema muestra un mensaje de error indicando que el formato del email es inválido. |

**Evidencia (página original 9):**

![Error por formato inválido de email](evidencias/04_error_formato_email.png)

##### Flujo Alternativo: Credenciales inválidas

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión. |
| 2 | Ingresar un email inexistente o incorrecto (ej. "usuario@invalido.com"). | El campo acepta el texto ingresado. |
| 3 | Ingresar una contraseña incorrecta (ej. "passwordincorrecta"). | El campo acepta el texto ingresado. |
| 4 | Hacer clic en el botón "Ingresar". | El sistema muestra un mensaje de error indicando Error de autenticacion y que intente de nuevo. |

**Evidencia (página original 10):**

![Error de autenticación por credenciales inválidas](evidencias/05_credenciales_invalidas.png)

##### Flujo Alternativo: Navegación a recuperación de contraseña

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión. |
| 2 | Hacer clic en el enlace "¿Olvidaste tu contraseña?". | El sistema redirige al usuario a la página de recuperación de contraseña. |

**Evidencias (página original 11):**

![Enlace a recuperación de contraseña](evidencias/06_enlace_recuperacion_contrasena.png)

![Formulario de recuperación de contraseña](evidencias/07_pagina_recuperacion_contrasena.png)

##### Flujo Alternativo: Navegación a registro

| N° | Pasos | Resultado Esperado |
|---|---|---|
| 1 | Ingresar a la URL https://managementsystem.me/login | El sistema muestra la página de inicio de sesión. |
| 2 | Hacer clic en el botón "Regístrate aquí". | El sistema redirige al usuario a la página de registro. |

**Evidencias (página original 12):**

![Enlace al registro de usuario](evidencias/08_enlace_registro.png)

![Formulario de registro de usuario](evidencias/09_formulario_registro.png)

#### c. Post condiciones que deben cumplirse para la realización de la prueba

- El usuario ha iniciado el proceso de autenticación correctamente.
- El sistema ha mostrado el modal de verificación para ingresar el código.
- Los mensajes de error son mostrados claramente cuando corresponde.
- La navegación entre las páginas relacionadas funciona correctamente.

### 2. RESULTADOS DE LA PRUEBA

| Defectos y desviaciones encontradas en las pruebas | Resultado (marcar x) |
|---|---|
| La prueba se realizó exitosamente sin encontrar algún error o bug durante la ejecución de esta en sus diferentes escenarios. | **[x] Con éxito**<br>[ ] Paralizada<br>[ ] Suspendida |

### Observaciones generales

Ninguna.

### Responsable de Prueba

**Primer responsable**

- Nombre: Josue Chambilla Zuñiga
- Fecha: 29/03/2025
- Firma:

![Firma de Josue Chambilla Zuñiga](evidencias/10_firma_josue_chambilla.png)

**Segundo responsable**

- Nombre: Jhonny Rivera Mendoza
- Fecha: 29/03/2025
- Firma:

![Firma de Jhonny Rivera Mendoza](evidencias/11_firma_jhonny_rivera.png)

---

## Caso de prueba CAP02 — CU02: Registro de Nuevos Usuarios

| Campo | Detalle |
|---|---|
| Caso N° | CAP02 |
| Caso de uso | CU02 — Registro de Nuevos Usuarios |
| Versión de ejecución | v2.0 |
| Fecha de ejecución | 19/04/2025 |
| Hora de ejecución | 1:00 1.m. |
| Módulo del sistema | Seguridad y Autenticación |

### Descripción de caso

Este caso de prueba verifica el proceso de registro de nuevos usuarios en el sistema. El objetivo es comprobar que un usuario pueda completar el formulario con sus datos personales, que el sistema valide la información en tiempo real y que, en caso de ser válida, permita la creación de la cuenta.

### 3. Caso de Prueba

**Tipo de prueba:** Funcional.

#### d. Precondiciones que deben cumplir para realizar la prueba

1. El sistema debe estar disponible y accesible en https://managementsystem.me/register.
2. La conexión a internet debe estar activa.
3. El correo electrónico a utilizar no debe estar registrado previamente en el sistema.

> **Nota de alcance:** El PDF proporcionado termina aquí, al inicio del caso CAP02. No contiene los pasos de ejecución ni los resultados posteriores de este caso.
