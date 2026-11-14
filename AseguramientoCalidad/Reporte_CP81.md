✔ Prueba Unitaria
Descripción: Se validó la lógica de control de formatos permitidos en el módulo de carga de material pedagógico. El objetivo es verificar que el endpoint restrinja la subida de archivos exclusivamente al formato PDF, rechazando cualquier otra extensión para garantizar la correcta vectorización en la base de conocimiento (ChromaDB).

Componente probado: Lógica de Negocio / Carga de material pedagógico para la IA (Python).

Casos cubiertos (automatizados):
`test_subir_archivo_txt_rechazado`: Verifica que el sistema bloquee un intento de carga de un archivo con extensión `.txt`, devolviendo el error HTTP correspondiente.
`test_subir_archivo_docx_rechazado`: Comprueba que el sistema intercepte y rechace un archivo con extensión `.docx`.

Resultado: Éxito (Los intentos de subir archivos en formatos no permitidos fueron rechazados correctamente).

Evidencia (salida CLI):

![Ejecución de Pruebas Unitarias CP-81](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-81_Output.txt)

Gráfico 01. Ejecución de Prueba Unitaria: CP-81 - Validación de Formato del Material

Fuente: Elaboración propia. 2026

Nota: Se valida el cumplimiento de las restricciones del endpoint `/upload-pdf` empleando casos de prueba automatizados con FastAPI TestClient. Los resultados evidencian que el sistema deniega exitosamente los archivos en formatos inválidos (como `.txt` y `.docx`), asegurando que solo los documentos PDF sean procesados.
