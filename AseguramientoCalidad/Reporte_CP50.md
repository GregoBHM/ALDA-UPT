✔ Prueba no funcional
Tiempo de respuesta: 0.065 segundos (Tiempo de respuesta del endpoint GET).
Carga simulada: Recuperación de una lista de 25 anuncios mediante el endpoint del estudiante.
Resultado: El sistema completó la extracción y entrega de la información cumpliendo holgadamente el Requerimiento No Funcional de rendimiento (el cual establecía un tiempo máximo de 2.0 segundos). La carga casi instantánea de 0.065 segundos garantiza que el estudiante no experimente demoras al acceder a su dashboard.

Evidencia (salida CLI):

![Ejecución de Prueba de Rendimiento CP-50](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-50_Output.txt)

Gráfico 01. Ejecución de Prueba de Rendimiento: CP-50 - Tiempo de Carga de Anuncios

Fuente: Elaboración propia. 2026

Nota: Se ejecutó un script de automatización para auditar el tiempo de respuesta real del servicio encargado de listar los comunicados (`GET /api/student/announcements`). El registro demuestra una latencia extremadamente baja (0.065s) para el retorno exitoso de 25 registros, confirmando la alta eficiencia en la consulta a la base de datos y transmisión de los datos.
