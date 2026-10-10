# 🚀 Cómo Correr el Proyecto ALDA Localmente (Windows)

> Este proyecto tiene **3 componentes** que deben levantarse en orden:
> 1. 🗄️ **Base de Datos** (PostgreSQL + ChromaDB via Docker)
> 2. ⚙️ **Backend** (FastAPI con Python)
> 3. 🌐 **Frontend** (React + Vite)

---

## ✅ Pre-requisitos

Asegúrate de tener instalado lo siguiente antes de comenzar:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Cualquier versión reciente | `docker --version` |
| [Python](https://www.python.org/downloads/) | 3.10 o superior | `python --version` |
| [Node.js](https://nodejs.org/) | 18 o superior | `node --version` |
| [Git](https://git-scm.com/) | Cualquier versión | `git --version` |

> [!IMPORTANT]
> Docker Desktop debe estar **abierto y ejecutándose** antes de continuar.

---

## Paso 1 — 🗄️ Levantar la Base de Datos (Docker)

Abre una terminal (PowerShell o CMD) en la raíz del proyecto y ejecuta:

```powershell
cd database
docker-compose up -d
```

Esto levantará dos contenedores:
- **`alda_postgres`** → PostgreSQL 15 en el puerto `5433`
- **`alda_chromadb`** → ChromaDB en el puerto `8100`

### Verificar que están corriendo

```powershell
docker ps
```

Deberías ver los contenedores `alda_postgres` y `alda_chromadb` con estado `Up`.

> [!NOTE]
> El archivo `database/.env` ya tiene las credenciales configuradas:
> ```
> DB_PASSWORD=Alda2026Secure
> ```

---

## Paso 2 — ⚙️ Levantar el Backend (FastAPI)

Abre una **nueva terminal** y navega a la carpeta `backend`:

```powershell
cd backend
```

### 2.1 Activar el entorno virtual

El entorno virtual ya existe en `backend/venv`. Solo actívalo:

```powershell
venv\Scripts\activate
```

> Si ves `(venv)` al inicio del prompt, está activado correctamente.

### 2.2 Instalar dependencias (solo la primera vez)

```powershell
pip install -r requirements.txt
```

### 2.3 Verificar el archivo `.env`

El archivo `backend/.env` ya está configurado con los valores correctos para desarrollo local:

```env
DB_HOST=localhost
DB_PORT=5433
POSTGRES_DB=alda_db
POSTGRES_USER=alda_admin
DB_PASSWORD=Alda2026Secure

CHROMA_HOST=localhost
CHROMA_PORT=8100

GOOGLE_AI_API_KEY=<tu_api_key>
```

> [!WARNING]
> Si la `GOOGLE_AI_API_KEY` ha expirado o no es válida, las funcionalidades de IA (chat socrático, RAG) no funcionarán. Reemplázala con una clave válida de [Google AI Studio](https://aistudio.google.com/).

### 2.4 Iniciar el servidor

```powershell
uvicorn main:app --reload --port 8000
```

El backend estará disponible en: **http://localhost:8000**  
Documentación interactiva (Swagger): **http://localhost:8000/docs**

---

## Paso 3 — 🌐 Levantar el Frontend (React + Vite)

Abre una **nueva terminal** y navega a la carpeta `frontend`:

```powershell
cd frontend
```

### 3.1 Instalar dependencias (solo la primera vez)

```powershell
npm install
```

### 3.2 Verificar el archivo `.env`

El archivo `frontend/.env` ya apunta al backend local:

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=89768386906-1i19pg7ocbcjb9eca7gh8hq5buahdqeo.apps.googleusercontent.com
```

### 3.3 Iniciar el servidor de desarrollo

```powershell
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

---

## 🗺️ Resumen de URLs

| Servicio | URL | Descripción |
|---|---|---|
| 🌐 Frontend | http://localhost:5173 | Interfaz web de ALDA |
| ⚙️ Backend API | http://localhost:8000 | API REST de FastAPI |
| 📄 Swagger Docs | http://localhost:8000/docs | Documentación interactiva de la API |
| 🗄️ PostgreSQL | localhost:5433 | Base de datos relacional |
| 🧠 ChromaDB | localhost:8100 | Base de datos vectorial (RAG) |

---

## 🔁 Orden de arranque (resumen rápido)

```
Terminal 1 (database/):   docker-compose up -d
Terminal 2 (backend/):    venv\Scripts\activate  →  uvicorn main:app --reload --port 8000
Terminal 3 (frontend/):   npm run dev
```

---

## 🛑 Cómo detener el proyecto

| Componente | Comando |
|---|---|
| Frontend / Backend | `Ctrl + C` en la terminal correspondiente |
| Base de datos Docker | `docker-compose down` (desde la carpeta `database/`) |
| Detener todo Docker | `docker stop alda_postgres alda_chromadb` |

> [!TIP]
> Si quieres eliminar los datos de la base de datos completamente:
> ```powershell
> docker-compose down -v
> ```
> El flag `-v` elimina los volúmenes (datos persistidos).

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: `docker: command not found`
Docker Desktop no está instalado o no está en el PATH. Instálalo desde [docker.com](https://www.docker.com/products/docker-desktop/).

### ❌ Error al conectar a PostgreSQL (port 5433)
- Verifica que Docker esté corriendo: `docker ps`
- Asegúrate de que `database/docker-compose.yml` expone el puerto `5433`, no `5432`.

### ❌ Error: `ModuleNotFoundError` en el backend
El entorno virtual no está activado. Ejecuta `venv\Scripts\activate` primero.

### ❌ El frontend muestra errores de CORS o no carga datos
- Verifica que el backend esté corriendo en `http://localhost:8000`.
- Verifica que `frontend/.env` tenga `VITE_API_URL=http://localhost:8000`.

### ❌ Login con Google no funciona
El `VITE_GOOGLE_CLIENT_ID` debe estar autorizado para el origen `http://localhost:5173` en la [Google Cloud Console](https://console.cloud.google.com/).

---

## 🧪 Cómo Ejecutar las Pruebas Automatizadas

Las pruebas automatizadas de Backend (incluyendo unitarias, de integración y rendimiento) se han configurado usando `pytest` y scripts nativos.

### Pasos para Ejecutarlas

1. Abre una terminal y activa el entorno virtual en la carpeta `backend`:
   ```powershell
   cd backend
   venv\Scripts\activate
   ```
2. Para pruebas **unitarias puras** (ej. CP-106) que no dependen del servidor web corriendo:
   ```powershell
   pytest tests\test_cp106.py -v -s
   ```
3. Para pruebas **de integración o rendimiento** (ej. CP-109, CP-110) se utiliza la librería `TestClient` de FastAPI para simular el servidor en memoria. Corre los scripts directamente:
   ```powershell
   python tests\test_cp109.py
   python tests\test_cp110.py
   ```
   > Los resultados de ejecución se guardan de forma automatizada dentro de la carpeta `Resultado de Pruebas/`.

### 🐛 Problemas Comunes en las Pruebas y Soluciones Implementadas

A lo largo de la ejecución automatizada de las pruebas, nos encontramos con dos errores comunes que fueron mitigados en el código:

#### 1. ❌ Error de codificación en Windows (UnicodeEncodeError)
* **El Problema:** Al hacer `print()` de caracteres Unicode (como flechas `→` o checks `✓`) en una terminal de Windows usando `cp1252`, el script lanzaba: `UnicodeEncodeError: 'charmap' codec can't encode character...`
* **La Solución:** Se reemplazaron todos los caracteres especiales en los scripts de prueba por equivalentes ASCII (ej. `->` en vez de `→`, y `[OK]` en lugar de `✓`).

#### 2. ❌ ConnectionRefusedError: No se puede establecer conexión a la Base de Datos
* **El Problema:** Los tests CP-109 y CP-110 (Integración y Rendimiento) intentaban conectar a la base de datos de Postgres local en el puerto `5433` (asumiendo que los contenedores estaban levantados), lo que provocaba que fallaran si Docker estaba apagado.
* **La Solución:** Refactorizamos las pruebas para inyectar un **Mock de Base de Datos** a través de `app.dependency_overrides[get_db]`. Esto permitió aislar los tests de la infraestructura. Además, se migró a `FastAPI TestClient` para probar directamente los endpoints HTTP sin necesidad de levantar el servidor `uvicorn` por separado, haciendo que las pruebas sean robustas y auto-suficientes.
