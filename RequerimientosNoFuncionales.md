### Cuadro de Requerimientos No Funcionales
*Tabla 3: Cuadro de Requerimientos No Funcionales Final. Fuente de origen: Propia.*

| ID | Categoría | Descripción | Criterio de aceptación |
| :--- | :--- | :--- | :--- |
| **RNF-01** | Seguridad de Acceso | El sistema debe garantizar que el acceso está estrictamente limitado a la comunidad universitaria con cuentas institucionales @virtual.upt.pe o personal externo validado. | Cualquier intento de inicio de sesión con un dominio distinto a @virtual.upt.pe debe ser rechazado en el 100% de los casos, exceptuando aquellos que hayan sido registrados previamente por el Administrador en la Lista Blanca. |
| **RNF-02** | Desempeño de IA | El tiempo de respuesta del tutor socrático debe ser fluido para no interrumpir el aprendizaje. | Las respuestas generadas por la IA deben mostrarse en la interfaz en un tiempo máximo de 5 segundos. |
| **RNF-03** | Rendimiento de Ejecución | La compilación y ejecución de código en el entorno seguro debe ser ágil. | El resultado de salida (stdout/stderr) debe retornar al usuario en menos de 2 segundos tras solicitar la ejecución. |
| **RNF-04** | Disponibilidad | El sistema debe estar operativo durante los periodos de laboratorios y estudio. | Se debe garantizar una disponibilidad del 99.5% durante el ciclo académico, asegurando el acceso constante. |
| **RNF-05** | Compatibilidad | La plataforma debe ser accesible desde navegadores estándar sin plugins adicionales. | Funcionamiento correcto en las últimas 2 versiones de Google Chrome, Mozilla Firefox y Microsoft Edge. |
| **RNF-06** | Usabilidad | La interfaz debe permitir una interacción rápida para alumnos de ciclos iniciales. | Un estudiante debe poder obtener su primer análisis de código en menos de 3 clics desde el inicio de su sesión. |
| **RNF-07** | Precisión (Fiabilidad) | El sistema debe clasificar correctamente los fallos de código capturados del entorno de ejecución. | El módulo de captura debe identificar el tipo de error (sintaxis, lógica o ejecución) con una precisión del 90%. |
| **RNF-08** | Aislamiento de Seguridad | El código del estudiante no debe tener capacidad de comprometer el servidor donde se hospeda la plataforma. | El entorno de ejecución debe estar aislado al 100%; el código del alumno no tendrá acceso a archivos o red interna del servidor. |