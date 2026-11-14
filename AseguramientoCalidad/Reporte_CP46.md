✔ Prueba Unitaria
Descripción: Se verificó la lógica de validación estructural de los datos recibidos al crear un anuncio académico. El objetivo es confirmar que el sistema bloquee la publicación de anuncios con información deficiente, exigiendo obligatoriamente que el título no se encuentre vacío y que el contenido principal posea una extensión mínima de 10 caracteres.

Componente probado: Lógica de Negocio / Creación de Anuncios (Validación con Pydantic).

Casos cubiertos (automatizados):
`test_crear_anuncio_valido`: Comprueba la aceptación (`Status: 200`) de un anuncio que satisface todos los criterios de validación.
`test_crear_anuncio_titulo_vacio`: Verifica el rechazo de un anuncio cuando el campo de título se recibe vacío.
`test_crear_anuncio_titulo_espacios`: Verifica el rechazo de un anuncio cuando el título se compone exclusivamente de espacios en blanco.
`test_crear_anuncio_contenido_corto`: Valida que el sistema rechace un anuncio si la longitud de su contenido es menor a 10 caracteres.

Resultado: Éxito (El framework de validación Pydantic procesó y rechazó correctamente las inconsistencias devolviendo error HTTP 422).

Evidencia (salida CLI):

![Ejecución de Pruebas Unitarias CP-46](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-46.txt)

Gráfico 01. Ejecución de Pruebas Unitarias: CP-46 - Validación de Estructura del Anuncio

Fuente: Elaboración propia. 2026

Nota: Se emplearon casos de prueba automatizados mediante FastAPI TestClient para validar las restricciones del modelo. Los resultados confirman que el sistema responde exitosamente aceptando el anuncio válido, y ejerce la protección de integridad de datos devolviendo el código `HTTP 422 Unprocessable Entity` frente a las tres variaciones de datos mal formados.
