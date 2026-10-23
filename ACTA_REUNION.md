# 📋 ACTA DE REUNIÓN DE EQUIPO — PROYECTO ALDA

**Código de Proyecto:** G04 — ALDA-UPT  
**Institución:** Universidad Privada de Tacna  
**Facultad:** Facultad de Ingeniería  
**Escuela:** Escuela Profesional de Ingeniería de Sistemas (EPIS)  
**Asignatura / Curso:** Taller de Proyectos / Desarrollo de Software  

---

## 1. Datos Generales de la Sesión

| Campo | Detalle |
| :--- | :--- |
| **Fecha:** | 23 de Octubre de 2026 |
| **Hora de Inicio:** | 10:00 hrs |
| **Hora de Cierre:** | 12:30 hrs |
| **Modalidad:** | Híbrida / Laboratorio de Cómputo EPIS |
| **Objetivo de la Reunión:** | Coordinación, estandarización de despliegue local y preparación de entregables para la presentación del proyecto ALDA. |

---

## 2. Asistentes y Roles

| Nombre Completo | Rol en el Proyecto | Código / Correo Institucional | Asistencia |
| :--- | :--- | :--- | :---: |
| **Gregory Huanca Mamani** | Líder Técnico & Backend / DevOps | `grehuanca@upt.pe` | Presente |
| **Andy Calizaya** | Frontend & QA / Evaluador | Institucional UPT | Presente |

---

## 3. Agenda Tratada

1. **Revisión del Manual de Despliegue Local:**
   - Unificación de archivos de configuración (`.env.local` y orquestación con `docker-compose.local.yml`).
   - Verificación de arranque en 3 pasos mediante un único comando reproducible.
2. **Definición de Entornos:**
   - Separación estricta entre despliegue local de laboratorio (puertos `5173`, `8000`, `5432`, `8100`) y despliegue en producción VPS (Dokploy / `alda-upt.sytes.net`).
3. **Plan de Pruebas en Vivo (Demostración en Salón de Clases):**
   - Ejecución del caso de prueba **CP-61 / CU-13**: Creación de laboratorios y casos de prueba automatizados con Pytest.
   - Verificación de Healthcheck del API y conectividad con PostgreSQL y ChromaDB.
   - Demostración de interfaz de estudiante, docente y editor de código en Monaco Editor.
4. **Limpieza y Organización del Repositorio:**
   - Purga de commits innecesarios y eliminación de configuraciones duplicadas.
   - Documentación exhaustiva en el `README.md`.

---

## 4. Acuerdos y Compromisos Adoptados

| N° | Acuerdo / Tarea | Responsable | Fecha Límite | Estado |
| :-: | :--- | :---: | :---: | :---: |
| **1** | Estandarizar el comando de despliegue reproducible en una sola línea con `docker compose -f docker-compose.local.yml --env-file .env.local up --build -d`. | Gregory Huanca | 23/10/2026 | **Completado** |
| **2** | Documentar en `README.md` el manual de despliegue paso a paso con prerequisitos, accesos y solución de fallos comunes. | Gregory Huanca | 23/10/2026 | **Completado** |
| **3** | Preparar el set de pruebas unitarias automatizadas (`test_cp61.py`) para validar el backend en la presentación presencial. | Andy Calizaya | 24/10/2026 | **Completado** |
| **4** | Realizar simulacro de instalación desde cero (`git clone` en máquina limpia) para garantizar tiempo de despliegue menor a 3 minutos. | Gregory / Andy | 24/10/2026 | **En Progreso** |
| **5** | Redactar y firmar el Acta de Reunión para adjuntar como entregable obligatorio. | Gregory / Andy | 24/10/2026 | **Completado** |

---

## 5. Firmas de Conformidad

Los suscritos declaran su conformidad con los puntos tratados y los acuerdos asumidos en la presente sesión.

<br><br>

```
________________________________________          ________________________________________
         Gregory Huanca Mamani                                   Andy Calizaya
   Líder Técnico & Backend / DevOps                        Frontend & Aseguramiento QA
     EPIS — Univ. Privada de Tacna                        EPIS — Univ. Privada de Tacna
```
