# 🧠 ALDA — AI-based Learning & Development Assistant

Plataforma educativa institucional para la Escuela de Ingeniería de Sistemas (EPIS — UPT).  
Tutor virtual inteligente con **Método Socrático**: guía al estudiante mediante preguntas reflexivas para que descubra las soluciones por sí mismo.

> **Autores:** Gregory Huanca & Andy Calizaya  
> **Institución:** Universidad Privada de Tacna — EPIS  
> **Versión:** 1.0 (2026)

---

## 🚀 Características

| Módulo | Descripción |
| :--- | :--- |
| **Tutoría IA (RAG)** | Google Gemini + ChromaDB. Respuestas basadas en documentos del docente |
| **IDE Web** | Monaco Editor (igual que VS Code) — C++, Python, Java, JavaScript |
| **Sandbox Seguro** | Compilación y ejecución aislada en contenedores Docker |
| **Roles** | Estudiante · Docente · Administrador (OAuth 2.0 Google) |
| **Anti-plagio / Juez IA** | Evaluación automática con casos de prueba ocultos |

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| Frontend | React 19 + Vite + Tailwind CSS + Monaco Editor |
| Backend | FastAPI (Python 3.12) |
| Base de Datos | PostgreSQL 15 |
| Base Vectorial | ChromaDB |
| IA | Google GenAI (Gemini 2.5 Flash) |
| Infraestructura | Docker + Docker Compose |

---

## ⚡ Despliegue Local — Desde Cero en 3 Pasos

### Requisitos previos
- **Docker Desktop** instalado y en ejecución (ícono verde en barra de tareas)
- **Git** instalado

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/GregoBHM/ALDA-UPT.git
cd ALDA-UPT
```

### Paso 2 — Configuración del archivo `.env.local`

El repositorio ya incluye el archivo `.env.local` preconfigurado con las claves necesarias para la ejecución local:

```ini
# ── Base de Datos ─────────────────────────────────────────
DB_PASSWORD=&WV_txqNd&Bq9Ki^

# ── Seguridad / Sesiones ──────────────────────────────────
SESSION_SECRET=2fwEKIIKV-jrqRJe4tXHKGd-qWMOcreFoHBbvPCZdvoBuep8gWdcmjX5zoWjgld0
SESSION_TTL_HOURS=8
COOKIE_SECURE=false

# ── Google OAuth ──────────────────────────────────────────
VITE_GOOGLE_CLIENT_ID=89768386906-1i19pg7ocbcjb9eca7gh8hq5buahdqeo.apps.googleusercontent.com
BOOTSTRAP_ADMIN_EMAIL=grehuanca@upt.pe

# ── URLs locales ──────────────────────────────────────────
VITE_API_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:8000

# ── Google AI (Gemini) ────────────────────────────────────
GOOGLE_AI_API_KEY=AIzaSyBM1TuB5E4RdSoIi6BsXmn8OI21S5Y7ofA
```

> Si se clona en una nueva máquina sin el archivo, simplemente copia `.env.example` como `.env.local` y coloca las claves de arriba.

### Paso 3 — Levantar todo con Docker Compose

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
docker compose -f docker-compose.local.yml --env-file .env.local up --build -d
```

Docker descargará las imágenes oficiales, compilará el backend y frontend, y levantará los 4 servicios automáticamente en segundo plano.

---

## 🌐 Accesos una vez levantado

| Servicio | URL |
| :--- | :--- |
| **Aplicación Web** | http://localhost:5173 |
| **API Backend** | http://localhost:8000 |
| **Documentación API (Swagger)** | http://localhost:8000/docs |
| **Base de Datos** | `localhost:5432` (usuario: `alda_admin`, db: `alda_db`) |
| **ChromaDB** | http://localhost:8100 |

---

## ✅ Verificar que todo funciona

### 1. Healthcheck de la infraestructura
```bash
curl http://localhost:8000/api/health
# Resultado esperado: {"status": "ok"}
```

### 2. Ver estado de los contenedores
```bash
docker compose -f docker-compose.local.yml ps
```
Los 4 contenedores deben estar en estado **Up**:
- `alda_postgres_local`
- `alda_chroma_local`
- `alda_backend_local`
- `alda_frontend_local`

### 3. Ver logs en tiempo real
```bash
docker compose -f docker-compose.local.yml logs -f backend
```

### 4. Verificar tablas de la base de datos
```bash
docker exec -it alda_postgres_local psql -U alda_admin -d alda_db -c "\dt"
```

---

## 🗂️ Estructura del Proyecto

```text
ALDA-UPT/
├── docker-compose.local.yml   # ← Orquestador principal (despliegue local)
├── docker-compose.yml         # Orquestador de producción (Dokploy)
├── .env.local               # Variables de entorno locales (preconfigurado)
├── .env.dokploy             # Variables de entorno para servidor Dokploy
├── .env.example             # Plantilla de variables (referencia)
├── backend/
│   ├── Dockerfile             # Build multi-stage Python 3.12-slim
│   ├── main.py                # Punto de entrada FastAPI
│   ├── models.py              # Modelos SQLAlchemy (ORM)
│   ├── database.py            # Conexión PostgreSQL
│   ├── chroma_service.py      # Gestión ChromaDB (RAG)
│   ├── routers/               # Endpoints: auth, admin, teacher, student
│   ├── services/              # Lógica de negocio por rol
│   ├── schemas/               # Validación Pydantic
│   ├── core/                  # Seguridad, sesiones, dependencias
│   └── requirements.txt       # Dependencias Python
├── frontend/
│   ├── Dockerfile             # Build Node 20 → Nginx
│   ├── nginx.conf             # Configuración SPA (React Router)
│   ├── src/
│   │   ├── components/        # Editor, Consola, Sidebar, etc.
│   │   ├── pages/             # Vistas por rol (admin, student, teacher)
│   │   └── api.js             # Cliente HTTP centralizado
│   └── package.json
└── database/
    └── schema.sql             # Tablas, ENUMs y datos iniciales
```

---

## 🔧 Comandos Útiles

```bash
# Apagar sin borrar datos
docker compose -f docker-compose.local.yml stop

# Apagar y eliminar contenedores (conserva volúmenes)
docker compose -f docker-compose.local.yml down

# Reinicio total desde cero (borra base de datos)
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml --env-file .env.local up --build -d

# Ver logs de un servicio específico
docker compose -f docker-compose.local.yml logs -f frontend
docker compose -f docker-compose.local.yml logs -f backend
docker compose -f docker-compose.local.yml logs -f db
```

---

## 📜 Licencia

Desarrollado para la Escuela Profesional de Ingeniería de Sistemas (EPIS) — Universidad Privada de Tacna (UPT).  
Uso académico institucional.
