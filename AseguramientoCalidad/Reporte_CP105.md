✔ Prueba no funcional
Tiempo de respuesta: 26.46 milisegundos (Tiempo de procesamiento en entorno local).
Número de usuarios: 1 administrador en sesión activa (entorno local).
Resultado: El cambio de rol se aplicó y persistió en la base de datos cumpliendo sobradamente el requerimiento no funcional de rendimiento (esperado < 1 segundo). La respuesta del endpoint de actualización (PUT) es casi instantánea, garantizando que los privilegios del usuario se revoquen o actualicen sin latencias perceptibles para el administrador ni para el usuario afectado.

Evidencia (salida CLI):

![Ejecución de Prueba de Rendimiento CP-105](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-105_Output.txt)

Gráfico 01. Ejecución de Prueba de Rendimiento: CP-105 - Tiempo de Aplicación del Cambio de Rol

Fuente: Elaboración propia. 2026

Nota: Se empleó un script automatizado para medir la latencia de la transición de un rol (ej. `student -> teacher`) directamente contra la API. Los resultados evidencian un tiempo de respuesta sumamente eficiente (~26.46 ms), confirmando que la actualización del estado en la base de datos y la respuesta HTTP operan de forma óptima y cumplen con gran margen el umbral máximo de 1 segundo establecido en los requisitos.
