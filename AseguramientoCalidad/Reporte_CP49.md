✔ Prueba de Integración
Descripción: Se verificó la correcta integración entre el módulo de creación de anuncios (Docente) y la vista del dashboard (Estudiante). El objetivo es asegurar que un anuncio recién publicado sea procesado correctamente por el sistema y entregado al endpoint del estudiante de forma inmediata, sin requerir acciones o sincronizaciones adicionales.

Componentes integrados:
- Panel de Administración del Docente (Módulo de Creación de Anuncios).
- Dashboard del Estudiante (Endpoint de consumo de anuncios).
- Base de Datos compartida (Persistencia y recuperación inter-rol).

Escenarios de Integración Evaluados (Automatizados):
- **Propagación del Anuncio Publicado:** Se simula la creación y guardado de un anuncio por parte del docente y, acto seguido, se interroga el endpoint de lectura desde el perfil de un estudiante para verificar que el nuevo contenido es servido correctamente en la respuesta.

Resultado: Éxito.
- La integración entre los flujos de creación y visualización operó correctamente.
- El endpoint del estudiante devolvió una respuesta exitosa (`HTTP 200 OK`) incluyendo en su cuerpo de datos el nuevo anuncio creado por el docente.

Evidencia (salida CLI):

![Ejecución de Prueba de Integración CP-49](/c:/Users/Andy/Documents/CONSTRUCCION%20DE%20SOFTWARE%20II/ALDA-UPT-main/ALDA-UPT-main/Resultado%20de%20Pruebas/CP-49_Output.txt)

Gráfico 01. Ejecución de Prueba de Integración: CP-49 - Integración Anuncios con Dashboard

Fuente: Elaboración propia. 2026

Nota: La prueba fue llevada a cabo inyectando simulaciones (mocks) de la base de datos para aislar la comunicación entre los endpoints Teacher y Student. El log de ejecución ratifica que la integración funcionó con total fluidez, entregando el anuncio al dashboard del estudiante en un tiempo sumamente corto (~87.33 ms).
