# ALDA-UPT — Despliegue local corregido (Windows + Docker Desktop)

**Revisión:** 1.1 · 7 de noviembre de 2026  
**Estado:** procedimiento propuesto y cotejado con el repositorio; **no se han ejecutado** pruebas reales en el equipo del usuario.  
**Ámbito:** local con `docker-compose.local.yml`. No usar el Compose de producción (`dokploy-network`, Traefik/Dokploy).

## 0. Seguridad, datos y versión

- Usar una computadora local de confianza. El backend tiene acceso a `/var/run/docker.sock`; la compilación de código no es un sandbox apto para personas desconocidas.
- **Si ya desplegaste ALDA:** antes de cambiar el montaje de ChromaDB, examina el volumen existente, realiza copia de seguridad y prueba recuperación en entorno aislado. `/chroma/chroma` (legado) y `/data` (actual) NO son rutas intercambiables automáticamente.
- **Si el repositorio ya fue clonado:** evita `git pull` con cambios locales sin revisar `git status`, y nunca borres un volumen para arreglar un error de arranque.
- Las credenciales filtradas en Git y README se consideran comprometidas, aunque se eliminen en una rama; deben revocarse/rotarse en sus proveedores, actualizar los consumidores y evaluar la limpieza de historial.
- La rama/código para esta guía debe fijarse por un commit SHA antes de la entrega. No tratar las etiquetas `latest` como reproducibles.

## 1. Requisitos Windows 10/11

1. Docker Desktop en modo contenedores Linux con WSL 2. Comprobar virtualización y WSL; reiniciar si lo pide el instalador.
2. Git para Windows y PowerShell. VS Code opcional.
3. Puertos 5173, 8000 y 8100 libres; internet para imágenes y proveedores externos. PostgreSQL escucha en 5432 solo dentro de la red de Docker (sin publicar 5432 en Windows).
4. 8 GB RAM y 15–20 GB libres son **referencias iniciales no validadas**, pueden requerirse más recursos para Java/C++ e imágenes.
5. Crear una carpeta fuera de `Program Files`, OneDrive o rutas protegidas, por ejemplo `C:\proyectos`.

```powershell
git --version
docker --version
docker compose version
docker info
wsl --status
```

**Esperado:** versiones visibles y `docker info` sin errores de conexión al daemon. Docker Desktop debe mostrar Linux containers.

## 2. Obtener código y verificar ubicación

**IMPORTANTE:** la plantilla `.env.local.example` solo existe en la rama de corrección mientras el PR siga sin fusionarse. El comando de clonación siguiente selecciona esa rama; cuando el PR se integre a `main`, vuelve a utilizar `main`.

```powershell
New-Item -ItemType Directory -Force C:\proyectos
Set-Location C:\proyectos
git clone --branch fix/manual-despliegue-local-2026-11 --single-branch --depth 1 https://github.com/GregoBHM/ALDA-UPT.git
Set-Location .\ALDA-UPT
Get-Location
Test-Path .\docker-compose.local.yml
Test-Path .\backend\Dockerfile
Test-Path .\frontend\Dockerfile
Test-Path .\database\schema.sql
git branch --show-current
git rev-parse HEAD
git status --short
```

**Esperado:** cuatro resultados `True`; anotar SHA exacto.

## 3. Preparar .env.local privado

La nueva rama proporciona una plantilla limpia `.env.local.example`; el archivo `.env.local` privado **no se incluye** en GitHub y nunca debe enviarse a nadie.

```powershell
Copy-Item .\.env.local.example .\.env.local
notepad .\.env.local
```

Modificar **antes** de iniciar:

| Clave | Uso |
| --- | --- |
| `DB_PASSWORD` | Contraseña local nueva y robusta; el backend usa URL.create para manejar correctamente los caracteres especiales |
| `SESSION_SECRET` | Cadena aleatoria de 32 o más caracteres |
| `SESSION_TTL_HOURS` | Por defecto 8 |
| `COOKIE_SECURE` | `false` solo para HTTP local |
| `VITE_GOOGLE_CLIENT_ID` | Cliente OAuth web autorizado en Google Cloud |
| `BOOTSTRAP_ADMIN_EMAIL` | Correo propio autorizado para administrador inicial |
| `VITE_API_URL` | `http://localhost:8000` |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8000` |
| `GOOGLE_AI_API_KEY` | Opcional para prueba de infraestructura; necesaria para funciones de IA |

Generar `SESSION_SECRET`:

```powershell
([guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N"))
```

**No copiar** secretos de antiguas versiones del repositorio. La primera conexión a una base existente no cambia la contraseña de PostgreSQL aunque se edite `DB_PASSWORD`; planificar rotación coordinada.

## 4. OAuth de Google

1. Google Cloud Console → APIs y servicios → Credenciales.
2. Crear/usar cliente OAuth 2.0 de tipo **Aplicación web**.
3. Agregar exactamente `http://localhost:5173` a orígenes de JavaScript autorizados.
4. Verificar pantalla de consentimiento, usuarios de prueba y cuenta permitida.
5. Colocar el Client ID en `.env.local`. Vite incorpora `VITE_*` en **build**: reconstruir frontend ante cambios.

Permisos de aplicación: `@virtual.upt.pe`, correo en lista blanca o `BOOTSTRAP_ADMIN_EMAIL`.

## 5. Validación previa y construcción

Ejecutar en la **raíz de ALDA-UPT**:

```powershell
docker info
docker compose --env-file .env.local -f docker-compose.local.yml config --quiet
docker compose --env-file .env.local -f docker-compose.local.yml config --services
docker compose --env-file .env.local -f docker-compose.local.yml up --build -d
docker compose --env-file .env.local -f docker-compose.local.yml ps
```

**Esperado:** `db`, `chroma`, `backend`, `frontend`; PostgreSQL saludable. El Compose corregido publica únicamente el frontend/API/puerto de diagnóstico Chroma en **127.0.0.1**, mantiene PostgreSQL accesible solo en la red interna de Docker y usa `chromadb/chroma:1.5.9` con volumen `/data`.

Si falla:

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 db
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 chroma
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 backend
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=80 frontend
```

**Precaución:** los logs pueden contener datos personales o tokens; censurarlos antes de compartir.

## 6. Pruebas técnicas verificables

```powershell
Invoke-RestMethod http://localhost:8000/api/health
docker exec -it alda_postgres_local psql -U alda_admin -d alda_db -c "\dt"
docker exec alda_backend_local docker version
docker image ls
```

- `/api/health` debe devolver `status : ok`: consulta SQL `SELECT 1` y TCP abierto hacia ChromaDB.
- `http://localhost:5173` debe cargar la portada.
- `http://localhost:8000/docs` debe abrir Swagger.
- `http://localhost:8100` puede NO tener interfaz web. Probar Chroma realmente:

```powershell
docker exec alda_backend_local python -c "import chromadb; print(chromadb.HttpClient(host='chroma',port=8000).heartbeat())"
```

- `docker version` verifica conexión al daemon, **no** que Java/C++ vean las rutas temporales entre contenedores.

## 7. Pruebas funcionales: no confundir con salud del contenedor

1. OAuth: entrar con usuario permitido, confirmar cookie de sesión y panel de rol.
2. Docente: crear laboratorio y casos de prueba.
3. Estudiante: listar laboratorio y probar IDE con `print("Hola desde ALDA")`.
4. Probar por separado Python, JavaScript, Java y C++: en Windows/WSL 2 el montaje `/tmp` de contenedores anidados puede requerir adaptación y **no** se considera validado por esta guía.
5. Con una clave IA válida: tutor socrático, carga PDF, generación y recuperación RAG.
6. Comprobar ChromaDB tras recrear el contenedor **sin** borrar volúmenes y verificar la persistencia.
7. Registrar hora, captura, SHA, resultado real y error concreto si falla.

## 8. Operación y respaldo

```powershell
docker compose --env-file .env.local -f docker-compose.local.yml stop
docker compose --env-file .env.local -f docker-compose.local.yml start
docker compose --env-file .env.local -f docker-compose.local.yml ps

docker exec alda_postgres_local pg_dump -U alda_admin -d alda_db -f /tmp/alda_backup.sql
docker cp alda_postgres_local:/tmp/alda_backup.sql .\alda_backup.sql
Test-Path .\alda_backup.sql
```

**ADVERTENCIA:** el respaldo `pg_dump` no incluye `chroma_local_data` ni `uploads_local_data`. Volúmenes no equivalen a copias de seguridad externas. Ensayar recuperación en instalación aislada antes de modificar un ambiente con datos.

**Nunca ejecutar `docker compose down -v` como solución de errores.** Puede borrar datos de la plataforma.

## 9. Fallas habituales

| Síntoma | Qué comprobar |
| --- | --- |
| `docker info` no conecta | Docker Desktop, Linux containers, WSL 2 |
| `Compose file not found` | `Get-Location` y `Test-Path .\docker-compose.local.yml` |
| `variable is not set` | archivo `.env.local` privado, nombre de variable y `config --quiet` |
| puerto ocupado | `Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue` |
| frontend carga, API falla | `/api/health` y logs backend/db/chroma |
| Swagger abre, health falla | BD/chroma inaccesibles o sin init |
| login Google falla | origen OAuth, client ID, cuenta de prueba y permisos |
| `403` | cuenta fuera de dominio/lista blanca/administrador |
| IDE ejecuta Python pero Java/C++ falla | imagen disponible, Docker socket, volumen temporal visible desde daemon host |
| RAG vacío tras recrear Chroma | ubicación real de archivos, volumen `/data`, respaldo/migración |
| esquema ausente | revisar inicio de DB con volumen nuevo; nunca borrar volumen sin respaldo |
| tutor IA no responde | proveedor, clave, cuota y acceso a internet |

## 10. Criterios de aceptación (registrar evidencia real)

| ID | Prueba | Aprobado si... |
| --- | --- | --- |
| PD-01 | Docker + Compose | comandos responden |
| PD-02 | Contenedores | cuatro servicios activos |
| PD-03 | API | `/api/health` devuelve ok |
| PD-04 | Web | `localhost:5173` carga |
| PD-05 | Base | ocho tablas base visibles |
| PD-06 | Chroma | `heartbeat()` responde y datos persisten |
| PD-07 | OAuth | usuario autorizado entra |
| PD-08 | IDE | al menos Python probado; otros lenguajes diferenciados |
| PD-09 | Tutor IA | solo si proveedor real está configurado |
| PD-10 | Respaldo | archivo SQL y prueba de recuperación sin datos de producción |
| PD-11 | Credenciales | no hay secretos reales públicos actuales; claves expuestas rotadas |

**NO afirmar aprobación total** si solo se ha verificado PD-01 a PD-05. El criterio final exige las pruebas funcionales y de persistencia relevantes.


## 11. Corrección aplicada al fallo "port is already allocated: 5432" (Windows)

Si el contenedor `alda_postgres_local` muestra redes vacías (`{}`) y el backend indica `Name or service not known` para `db`, **no** cambies `DB_HOST` a localhost. El puerto 5432 debe mantenerse dentro de Docker, pero no debe publicarse en Windows.

La configuración local corregida elimina `ports: "127.0.0.1:5432:5432"` del servicio `db`. El backend alcanza la base mediante `db:5432`. También incluye un healthcheck del backend (que consulta `/api/health`) y condiciona el inicio del frontend a su estado saludable.

### Recuperación sin borrar volúmenes

```powershell
Set-Location C:\proyectos\ALDA-UPT
git branch --show-current
git status --short
git pull --ff-only origin fix/manual-despliegue-local-2026-11
docker compose --env-file .env.local -f docker-compose.local.yml config --quiet
docker compose --env-file .env.local -f docker-compose.local.yml up -d --no-deps --force-recreate db
docker compose --env-file .env.local -f docker-compose.local.yml up -d --build
docker compose --env-file .env.local -f docker-compose.local.yml ps
Invoke-RestMethod http://localhost:8000/api/health
```

No sobrescribas tu `.env.local`. Si tienes cambios locales en Compose, respáldalos y reconcílialos antes de hacer pull. Nunca uses `down -v`. Tras el primer `up`, PostgreSQL debe figurar como conectado a la red `alda-upt_default` y estar `healthy`.

Si aún falla, revisa la conectividad desde el backend:

```powershell
docker exec alda_backend_local python -c "import socket; print(socket.gethostbyname('db')); s=socket.create_connection(('db',5432),5); print('Conexion TCP: OK'); s.close()"
docker compose --env-file .env.local -f docker-compose.local.yml logs --tail=60 backend db chroma
```

Si `Connection TCP: OK` aparece pero `/api/health` falla, revisar las trazas del backend: una configuración SQL/contraseña existente puede ser la causa. No compartir secretos en logs.

## Referencias

- Repositorio: https://github.com/GregoBHM/ALDA-UPT
- Docker Desktop y WSL 2: https://docs.docker.com/desktop/features/wsl/
- Chroma en Docker (montaje `/data`): https://cookbook.chromadb.dev/running/running-chroma/
- Seguridad GitHub: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
