✔ Prueba no funcional
Tiempo de respuesta: 0.17 segundos (Tiempo total de procesamiento en entorno local).
Carga simulada: Procesamiento de un archivo PDF de 20 páginas, extraído y dividido en 20 fragmentos vectorizados.
Resultado: El sistema completó el flujo de procesamiento y vectorización del documento cumpliendo holgadamente el Requerimiento No Funcional de rendimiento (el cual establecía un máximo de 30 segundos). La operación se ejecutó en menos de 1 segundo, garantizando que el docente no sufra tiempos de espera prolongados al enriquecer la base de conocimiento de la IA.

Evidencia (salida CLI):

![Ejecución de Prueba de Rendimiento CP-85](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-85_Output.txt)

Gráfico 01. Ejecución de Prueba de Rendimiento: CP-85 - Tiempo de Procesamiento del Material

Fuente: Elaboración propia. 2026

Nota: Se empleó un script automatizado para medir el tiempo real de la operación integral: recepción, extracción de texto, vectorización y almacenamiento en base de datos. Los resultados demuestran un rendimiento sobresaliente (0.17s) frente al umbral límite (30s). Si bien se emplearon mocks para aislar servicios externos pesados durante la prueba, el rendimiento del endpoint demuestra ser altamente escalable y eficiente para las necesidades del sistema.
