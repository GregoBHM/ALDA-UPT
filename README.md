# 🧠 ALDA-UPT — AI-based Learning & Development Assistant

Plataforma educativa de la **Escuela Profesional de Ingeniería de Sistemas (UPT)** con tutoría socrática asistida por IA, editor de código, laboratorios y roles de **estudiante, docente y administrador**.

**Autores:** Gregory Huanca y Andy Calizaya · **Proyecto académico 2026**

## Tecnologías

| Componente | Tecnología |
| --- | --- |
| Frontend | React 19 + Vite + Nginx |
| Backend | FastAPI + Python 3.12 |
| Base de datos | PostgreSQL 15 |
| Base vectorial / RAG | ChromaDB |
| Autenticación e IA | Google OAuth + Gemini |
| Entorno local | Docker Desktop + Docker Compose |

## 🚀 Despliegue local en Windows (paso a paso)

> Esta guía utiliza la **rama de correcciones** `fix/manual-despliegue-local-2026-11` mientras se revisa el [PR #1](https://github.com/GregoBHM/ALDA-UPT/pull/1). La rama `main` todavía no contiene todas las correcciones del Compose ni la plantilla local. **No uses el `docker-compose.yml` de Dokploy para estas pruebas.**

### 1. Instalar y comprobar herramientas

Necesitas **Windows 10/11**, **Docker Desktop** (motor Linux con WSL 2), **Git** y **PowerShell**. Conexión a Internet y puertos **5173, 8000, 5432 y 8100** disponibles. Como referencia inicial, 8 GB de RAM y 15–20 GB libres.

Abre Docker Desktop y ejecuta en PowerShell:

```powershell
git --version
docker compose version
docker info
```

### 2. Descargar el proyecto corregido

```powershell
New-Item -ItemType Directory -Force C:\proyectos
Set-Location C:\proyectos
git clone --branch fix/manual-despliegue-local-2026-11 --single-branch https://github.com/GregoBHM/ALDA-UPT.git
Set-Location .\ALDA-UPT
```

Si ya tienes una instalación con usuarios, PDF o documentos de ChromaDB, **realiza un respaldo antes de actualizar**: el montaje de Chroma cambió a `/data` y los datos antiguos podrían requerir migración.

### 3. Configurar las variables

```powershell
Copy-Item .\.env.local.example .\.env.local
notepad .\.env.local
```

Reemplaza los valores `REEMPLAZAR_...` con tus datos:

- `DB_PASSWORD`: contraseña **nueva** de PostgreSQL (preferiblemente alfanumérica).
- `SESSION_SECRET`: cadena aleatoria de **32 caracteres o más**. Puedes generar una con el comando siguiente.
- `VITE_GOOGLE_CLIENT_ID`: ID de cliente OAuth **Aplicación web** de Google Cloud.
- `BOOTSTRAP_ADMIN_EMAIL`: correo propio permitido para el administrador inicial.
- `VITE_API_URL=http://localhost:8000` y `CORS_ORIGINS=http://localhost:5173,http://localhost:8000`.
- `GOOGLE_AI_API_KEY`: opcional para levantar la infraestructura; necesaria para funciones de IA que la utilicen.

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

En **Google Cloud Console → APIs y servicios → Credenciales**, registra `http://localhost:5173` en **Orígenes autorizados de JavaScript** del cliente OAuth. Configura también la pantalla de consentimiento y los usuarios permitidos. El ID de Google se incorpora al compilar el frontend.

**Nunca publiques `.env.local` ni reutilices claves antiguas del repositorio.**

### 4. Construir y levantar los servicios

Desde `C:\proyectos\ALDA-UPT`:

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml config --quiet
docker compose --env-file .env.local -f docker-compose.local.yml up --build -d
docker compose --env-file .env.local -f docker-compose.local.yml ps
```

Se iniciarán `db`, `chroma`, `backend` y `frontend`. La primera construcción descarga imágenes y puede demorar.

### 5. Comprobar funcionamiento

```powershell
Invoke-RestMethod http://localhost:8000/api/health
docker exec alda_postgres_local psql -U alda_admin -d alda_db -c "\dt"
```

El primer comando debe devolver `status: ok` y el segundo listar las tablas.

| Servicio | Acceso local |
| --- | --- |
| Aplicación ALDA | http://localhost:5173 |
| API / Swagger | http://localhost:8000/docs |
| Estado API | http://localhost:8000/api/health |
| ChromaDB (puerto API, no interfaz web) | http://localhost:8100 |

Luego prueba **Google Login**, crear un laboratorio, ejecutar `print("Hola desde ALDA")` en el IDE y usar el tutor IA si configuraste una clave válida. El estado `ok` de la API **no** confirma por sí solo que el IDE o la IA funcionen.

## 🛠️ Comandos útiles

```powershell
# Revisar errores
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 backend

# Detener sin borrar datos
docker compose --env-file .env.local -f docker-compose.local.yml stop

# Volver a iniciar
docker compose --env-file .env.local -f docker-compose.local.yml start
```

**Importante:** evita `docker compose down -v`: elimina volúmenes y puede borrar usuarios, laboratorios, PDF y datos vectoriales. Los archivos de entorno previamente publicados deben considerarse comprometidos hasta rotar/revocar sus credenciales. El backend accede al socket Docker para ejecutar código; úsalo únicamente en un equipo de confianza. En Windows, Java y C++ requieren una prueba adicional de los montajes temporales entre contenedores.

## 📖 Manual completo

Para explicación detallada, diagnóstico y evidencias: [Manual de despliegue local corregido](https://github.com/GregoBHM/ALDA-UPT/blob/fix/manual-despliegue-local-2026-11/docs/DESPLIEGUE_LOCAL_CORREGIDO.md). Esta guía corta es para una instalación **local**; el despliegue remoto usa otra configuración con **Dokploy/Traefik**.
