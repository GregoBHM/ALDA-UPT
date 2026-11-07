# ALDA-UPT — AI-based Learning & Development Assistant

Plataforma educativa de la Escuela Profesional de Ingeniería de Sistemas (UPT): tutoría socrática con IA/RAG, laboratorios de programación, IDE web y roles estudiante/docente/administrador.

## Componentes
- **Frontend:** React, Vite y Nginx (contenedor web).
- **Backend:** FastAPI, Python 3.12 y cliente Docker para ejecutar código.
- **Base relacional:** PostgreSQL 15, inicializada con `database/schema.sql` solo al crear un volumen nuevo.
- **Base vectorial:** ChromaDB, fijada en la versión 1.5.9 para el entorno local.

## Requisitos para Windows 10/11
Docker Desktop con contenedores Linux y motor WSL 2, Git para Windows, PowerShell, conexión a internet y puertos 5173, 8000, 5432 y 8100 libres.

## Despliegue local (PowerShell)

**Mientras la corrección sea un PR sin fusionar**, clonar la rama de revisión explícita. Cuando se apruebe y fusione, utilizar `main` en lugar de esta rama.

```powershell
New-Item -ItemType Directory -Force C:\proyectos
Set-Location C:\proyectos
git clone --branch fix/manual-despliegue-local-2026-11 --single-branch --depth 1 https://github.com/GregoBHM/ALDA-UPT.git
Set-Location .\ALDA-UPT
Copy-Item .\.env.local.example .\.env.local
notepad .\.env.local
```

Completa en **tu propio** `.env.local` con secretos nuevos; **nunca copies claves del historial público**. Necesitas `DB_PASSWORD`, `SESSION_SECRET` (mínimo 32 caracteres), `VITE_GOOGLE_CLIENT_ID`, `BOOTSTRAP_ADMIN_EMAIL`, URL de API y orígenes CORS correctos. Genera una clave de sesión con:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

Configura en Google Cloud Console un cliente OAuth de tipo aplicación web con origen autorizado `http://localhost:5173`. El acceso requiere cuenta autorizada; una web visible no demuestra que OAuth funcione.

```powershell
docker info
docker compose --env-file .env.local -f docker-compose.local.yml config --quiet
docker compose --env-file .env.local -f docker-compose.local.yml up --build -d
docker compose --env-file .env.local -f docker-compose.local.yml ps
Invoke-RestMethod http://localhost:8000/api/health
```

Deberías poder abrir `http://localhost:5173` (web) y `http://localhost:8000/docs` (Swagger). El endpoint health verifica una consulta simple a PostgreSQL y conectividad TCP a ChromaDB; no confirma que el RAG ni el IDE funcionen.

## Verificación adicional

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 backend
docker exec -it alda_postgres_local psql -U alda_admin -d alda_db -c "\dt"
docker exec alda_backend_local docker version
docker image ls
```

Prueba manualmente: inicio de sesión Google, roles, creación de laboratorio, ejecución de Python y otros lenguajes, subida y consulta de PDF con RAG, y persistencia después de recrear contenedores **sin eliminar volúmenes**.

> **Advertencia Windows/IDE:** El compilador usa el socket Docker y un montaje temporal de `/tmp`. Que `docker version` funcione dentro del backend no garantiza que los contenedores anidados de Java/C++ vean los archivos; hay que validarlo en el Docker Desktop/WSL 2 concreto. El socket Docker otorga privilegios elevados sobre el motor: esta instalación es de confianza local, no un entorno seguro para ejecutar código de personas desconocidas.

> **Advertencia ChromaDB:** El Compose corregido monta `/data`, como requieren las imágenes actuales de ChromaDB. Si ya tienes un volumen de ChromaDB con datos, no sobrescribas ni recrees nada antes de verificar su ubicación real y guardar respaldo. Cambiar el montaje sin migración puede dar la impresión de que desaparecieron documentos.

## Operación y protección de datos

```powershell
# Detener conservando datos
docker compose --env-file .env.local -f docker-compose.local.yml stop

# Volver a activar
docker compose --env-file .env.local -f docker-compose.local.yml start

# Respaldo lógico de PostgreSQL
docker exec alda_postgres_local pg_dump -U alda_admin -d alda_db -f /tmp/alda_backup.sql
docker cp alda_postgres_local:/tmp/alda_backup.sql .\alda_backup.sql
```

`stop` y `down` no eliminan volúmenes. **No ejecutes `docker compose down -v` si necesitas conservar los datos.** Un respaldo PostgreSQL no incluye los datos ChromaDB ni los PDFs subidos: respáldalos por separado y ensaya restauraciones en una instalación aislada. Los cambios posteriores en `schema.sql` no migran una BD previamente creada.

## Seguridad del repositorio

Los archivos `.env.local` y `.env.dokploy` fueron rastreados en versiones anteriores del repositorio público. **Las claves que contengan deben considerarse comprometidas:** revoca/rótalas en los proveedores correspondientes, actualiza sus consumidores, elimina archivos confidenciales de las ramas publicadas y coordina limpieza del historial Git. Quitar archivos de la rama actual **no** borra copias previas del historial o forks.

Solo `.env.example` y `.env.local.example` son plantillas públicas, sin valores de secretos reales. No publiques logs, capturas o respaldos que incluyan tokens y contraseñas.

## Despliegue remoto
`docker-compose.yml` corresponde a la modalidad VPS/Dokploy: exige `dokploy-network`, Traefik, HTTPS y un dominio configurado. **No es el Compose de este tutorial local**.

Documentación más detallada: [docs/DESPLIEGUE_LOCAL_CORREGIDO.md](docs/DESPLIEGUE_LOCAL_CORREGIDO.md).

Documentación oficial: [Docker Desktop WSL 2](https://docs.docker.com/desktop/features/wsl/), [Chroma Docker](https://cookbook.chromadb.dev/running/running-chroma/), [GitHub: quitar datos confidenciales](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
