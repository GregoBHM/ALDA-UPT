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

### Paso 2 — Crear el archivo `.env` en la raíz del proyecto

Crear el archivo `.env` con el siguiente contenido (todas las claves ya configuradas para local):

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

> En **Windows PowerShell**, copiar el bloque de arriba en un nuevo archivo `.env` en la raíz del proyecto.

### Paso 3 — Levantar todo con Docker Compose

```bash
docker compose -f docker-compose.local.yml up --build -d
```

Eso es todo. Docker descarga las imágenes, construye los contenedores y levanta el sistema completo.

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

### 4. Pruebas unitarias del backend (CU-13 / CP-61)
```bash
cd backend
venv\Scripts\python.exe -m pytest tests/test_cp61.py -v
```
```
tests/test_cp61.py::test_cp61_crea_laboratorio_y_confirma_transaccion  PASSED
tests/test_cp61.py::test_cp61_registra_tres_casos_y_uno_oculto         PASSED
tests/test_cp61.py::test_cp61_aplica_valores_predeterminados           PASSED
tests/test_cp61.py::test_cp61_rechaza_titulo_vacio_o_espacios[]        PASSED
tests/test_cp61.py::test_cp61_rechaza_titulo_vacio_o_espacios[   ]     PASSED
======================== 5 passed in 3.08s ==============================
```

### 5. Verificar tablas de la base de datos
```bash
docker exec -it alda_postgres_local psql -U alda_admin -d alda_db -c "\dt"
```

---

## 🗂️ Estructura del Proyecto

```text
ALDA-UPT/
├── docker-compose.local.yml   # ← Orquestador principal (despliegue local)
├── docker-compose.yml         # Orquestador de producción (Dokploy)
├── .env                       # Variables de entorno locales (NO se sube a Git)
├── .env.example               # Plantilla de variables (referencia)
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
│   ├── requirements.txt       # Dependencias Python
│   └── tests/
│       └── test_cp61.py       # Pruebas unitarias CU-13
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
docker compose -f docker-compose.local.yml up --build -d

# Ver logs de un servicio específico
docker compose -f docker-compose.local.yml logs -f frontend
docker compose -f docker-compose.local.yml logs -f db
```

---

## ⚠️ Solución de Problemas Comunes

| Error | Causa | Solución |
| :--- | :--- | :--- |
| `failed to connect to docker API` | Docker Desktop no está iniciado | Abrir Docker Desktop y esperar hasta que el ícono quede verde |
| `port 5432 already allocated` | PostgreSQL de Windows corriendo | `Stop-Service postgresql*` en PowerShell |
| `port 8000 already allocated` | Otro proceso en el puerto | `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process -Force` |
| `SESSION_SECRET debe tener 32 chars` | Clave corta o vacía en `.env` | Verificar que `SESSION_SECRET` tenga al menos 32 caracteres |
| Frontend muestra `Network Error` | Backend aún arrancando | Esperar 30 seg y verificar `http://localhost:8000/api/health` |

---

## 📜 Licencia

Desarrollado para la Escuela Profesional de Ingeniería de Sistemas (EPIS) — Universidad Privada de Tacna (UPT).  
Uso académico institucional.
