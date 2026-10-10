# Descripción de la información a completar en cada columna

| Columna | Instrucciones | Valores / Referencias |
|---|---|---|
| **Id** | Cada caso de prueba debe tener un identificador (código) único. | |
| **Caso de Prueba** | Título descriptivo del caso de prueba. | |
| **Tipo de Prueba** | Referenciar el tipo de prueba a realizar (Unitaria, Integral, Funcional, de Aceptación, etc.). | |
| **Nivel** | Corresponden a la profundidad o alcance que tiene la prueba dentro del sistema. | |
| **Fase** | Ubican temporalmente la prueba dentro del proceso de desarrollo. | |
| **Responsable** | Define quién realiza cada tipo de prueba, según su rol. | |
| **Descripción** | Descripción del caso de prueba, indicando sus elementos, funcionalidades y acciones a ser ejercidas en el caso de prueba. | |
| **Fecha** | Fecha en que fue creado el caso de prueba. | |
| **Área Funcional / Sub proceso** | Describe el área funcional, subproceso o módulo al que está asociado el caso de prueba. La intención es poder dividir los casos de prueba según la estructura jerárquica funcional del sistema que se está probando y los procesos que este soporta. | |
| **Funcionalidad / Característica** | Describe el título de la característica o funcionalidad que se está probando (Caso de uso de referencia). Por ejemplo: Suscripción al Servicio, Entrega de Orden, Selección de Producto, Consulta de Órdenes Pendientes. | |
| **Requerimientos de Ambiente de Pruebas** | Cualquier especificación del hardware y software especial requerido para ejecutar el caso de prueba, que no sea común a todos los casos. | |
| **Procedimientos especiales requeridos** | Se describen cualquier restricción o condicionamiento en los procedimientos de prueba asociados a cada caso. | |
| **Dependencias con otros casos de Prueba** | Lista de los identificadores de los casos de prueba que deben ejecutarse antes de este caso. También puede incluir un sumario de la naturaleza de estas dependencias. | |
| **Modalidad de Prueba** | Manual o automatizada. | **Manual / Automatizada** |
| **Entorno de Prueba** | Alfa o Beta. | **Alfa / Beta** |
| **Resultado Obtenido** | Se describe el resultado real obtenido de la ejecución del caso de prueba. Este es una columna de seguimiento. Si este difiere del resultado esperado, debería especificarse en un reporte de incidencia. | |
| **Estado** | Estado actual del caso de prueba. | Pendiente / Finalizada / Suspendida / etc. |
| **Última Fecha de Estado** | Última fecha en que se ejecutó una acción referente al caso o que este cambió de estado. | |
| **Observaciones** | Observaciones relacionadas con la ejecución de los casos y de los resultados que se obtuvieron. | |

## Tipos de prueba

- Prueba Unitaria
- Prueba de Integración
- Prueba Funcional
- Prueba Punto a Punto
- Prueba de Regresión
- Prueba de Humo
- Prueba de Aceptación
- Prueba de Rendimiento