✔ Prueba Funcional

Tipo: Manual

Pasos ejecutados:
1. Inicio de sesión como docente con credenciales válidas.
2. Navegación al módulo de gestión de material pedagógico en el panel del docente.
3. Selección de un archivo de prueba en formato PDF desde el sistema local y ejecución de la acción de subida.
4. Verificación visual en la interfaz del mensaje o indicador de confirmación tras la finalización de la carga.
5. Comprobación de que el archivo fue procesado en el Backend, validando su correcta vectorización e indexación en la base de datos vectorial (ChromaDB).

Resultado esperado: El docente debe poder subir documentos PDF mediante la interfaz gráfica del sistema sin inconvenientes. Luego de la recepción, el sistema debe ser capaz de procesar el texto, vectorizar su contenido de forma automática y almacenarlo en ChromaDB, asegurando que quede disponible para enriquecer el contexto del tutor IA (RAG).

Resultado obtenido: Éxito. La interfaz permitió la carga fluida del archivo PDF mostrando una confirmación visual. A nivel interno, el sistema procesó el contenido y completó exitosamente la vectorización y el almacenamiento en ChromaDB, cumpliendo con el flujo integral esperado.

Evidencia:

![Selección de archivo para carga](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-82parte1.png)

Gráfico 01. Interfaz de carga de material pedagógico (CP-82, Parte 1)

Fuente: Elaboración propia. 2026

Nota: Se evidencia la interacción del docente en el panel correspondiente, preparándose para subir a la plataforma un archivo con formato PDF desde su almacenamiento local.

---

![Mensaje de éxito tras la carga](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-82parte2.png)

Gráfico 02. Confirmación de carga exitosa en la interfaz (CP-82, Parte 2)

Fuente: Elaboración propia. 2026

Nota: El Frontend refleja un comportamiento adecuado informando al docente, mediante notificaciones en pantalla, que el archivo ha sido transferido y recibido correctamente por el servidor.

---

![Verificación de almacenamiento e indexación](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-82parte3.png)

Gráfico 03. Verificación de vectorización e indexación en ChromaDB (CP-82, Parte 3)

Fuente: Elaboración propia. 2026

Nota: Se corrobora a nivel de infraestructura que el texto del documento PDF fue extraído, transformado en vectores y persistido de manera exitosa en la colección de ChromaDB, dejándolo completamente disponible para el modelo LLM.
