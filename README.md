# 🧠 ALDA (AI-based Learning & Development Assistant)

![ALDA Hero Banner](frontend/public/favicon.svg) <!-- Reemplaza con una ruta real si tienes un banner -->

**ALDA** es una plataforma educativa institucional diseñada para la Escuela de Ingeniería de Sistemas (EPIS - UPT). Actúa como un tutor virtual inteligente que emplea el **Método Socrático** para enseñar a programar. En lugar de dar respuestas directas, ALDA guía a los estudiantes mediante preguntas reflexivas para que descubran las soluciones por sí mismos, fomentando la autonomía y el pensamiento crítico.

---

## 🚀 Características Principales

*   **Tutoría Socrática con IA (RAG):** Integración con Google GenAI y ChromaDB. La IA responde basándose estrictamente en los documentos, reglas y sílabos (PDFs) subidos por el profesor.
*   **IDE Web Integrado:** Editor de código en vivo (Monaco Editor) en el navegador con soporte para múltiples lenguajes (C++, Python, Java, JS).
*   **Sandbox de Ejecución Seguro:** Compilación y ejecución de código en tiempo real con consola interactiva y evaluación contra Casos de Prueba ocultos.
*   **Roles y Permisos (OAuth 2.0):** 
    *   👨‍🎓 **Estudiante:** Accede a catálogos de retos, métricas de progreso y la sala de práctica.
    *   👨‍🏫 **Docente:** Gestiona laboratorios, sube material de conocimiento (RAG) y visualiza analíticas de errores grupales.
    *   🛡️ **Administrador:** Gestiona la lista blanca de correos, roles, auditorías de seguridad y monitorea el consumo de la API.

---

## 🛠️ Stack Tecnológico

El proyecto está dividido en un Frontend moderno y un Backend robusto basado en microservicios y contenedores.

### Frontend
*   **Framework:** React 18 + Vite
*   **Estilos:** Tailwind CSS / Vanilla CSS
*   **Iconos:** Lucide React
*   **Editor:** Monaco Editor (VS Code Web)
*   **Autenticación:** Google OAuth

### Backend & AI
*   **Framework:** FastAPI (Python)
*   **Base de Datos Relacional:** PostgreSQL 15
*   **Base de Datos Vectorial:** ChromaDB
*   **Procesamiento de Documentos:** `pdfplumber` (Extracción de texto para RAG)
*   **Modelos de Lenguaje:** Google GenAI (Embeddings y Generación de Texto)
*   **Infraestructura:** Docker & Docker Compose

---

## ⚙️ Configuración y Despliegue Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/GregoBHM/ALDA-UPT.git
cd ALDA-UPT
```

### 2. Levantar la Base de Datos (Docker)
Asegúrate de tener Docker instalado y en ejecución.
```bash
cd database
docker-compose up -d
```

### 3. Configurar y Levantar el Backend (FastAPI)
Requiere Python 3.10 o superior.
```bash
cd backend
# Crear entorno virtual
python -m venv venv
# Activar entorno (Windows)
venv\Scripts\activate
# Activar entorno (Linux/Mac)
# source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (Crea un archivo .env basado en el template)
# Iniciar el servidor
uvicorn main:app --reload --port 8000
```

### 4. Configurar y Levantar el Frontend (React/Vite)
Requiere Node.js 18 o superior.
```bash
cd frontend
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173` y el backend en `http://localhost:8000`.

---

## 📁 Estructura del Proyecto

```text
ALDA-UPT/
├── backend/               # Lógica de servidor, endpoints FastAPI y RAG (ChromaDB)
│   ├── main.py            # Archivo principal de FastAPI
│   ├── chroma_service.py  # Conexión y gestión de Base de Datos Vectorial
│   └── database.py        # Conexión a PostgreSQL
├── frontend/              # Aplicación SPA en React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables (Editor, Consola, Sidebar)
│   │   ├── pages/         # Vistas divididas por roles (admin, student, teacher)
│   │   └── api.js         # Configuración de peticiones al Backend
└── database/              # Scripts de inicialización y configuración Docker
    ├── docker-compose.yml # Orquestación de PostgreSQL
    └── schema.sql         # Tablas y estructura inicial
```

---

## 📜 Licencia y Autoría

Desarrollado para la Escuela Profesional de Ingeniería de Sistemas (EPIS) de la Universidad Privada de Tacna (UPT).
**Autores:** Andy Calizaya y Gregory Huanca.
**Versión:** 1.0 (2026)
