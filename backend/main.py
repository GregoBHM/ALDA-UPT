from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import os
import socket
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

DOCKER_IMAGES = [
    "python:3.10-alpine",
    "node:18-alpine",
    "eclipse-temurin:17-alpine",
    "gcc:12",
    "bash:5",
]


async def _precache_docker_images():
    async def pull_single_image(image: str):
        try:
            inspect_proc = await asyncio.create_subprocess_exec(
                "docker", "image", "inspect", image,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await inspect_proc.wait()
            if inspect_proc.returncode == 0:
                print(f"[ALDA Sandbox] ✓ Imagen lista (ya cacheada): {image}")
                return
        except Exception:
            pass

        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"[ALDA Sandbox] ⏳ Descargando imagen {image} (Intento {attempt + 1}/{max_retries})...")
                proc = await asyncio.create_subprocess_exec(
                    "docker", "pull", image,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL,
                )
                await proc.wait()
                if proc.returncode == 0:
                    print(f"[ALDA Sandbox] ✓ Imagen descargada exitosamente: {image}")
                    return
                else:
                    print(f"[ALDA Sandbox] ⚠ Falló pull de {image} con código de salida {proc.returncode}")
            except Exception as e:
                print(f"[ALDA Sandbox] ✗ Error al descargar {image}: {e}")

            await asyncio.sleep(5)

        print(f"[ALDA Sandbox] ❌ No se pudo preparar la imagen {image} tras {max_retries} intentos.")

    await asyncio.gather(*(pull_single_image(image) for image in DOCKER_IMAGES))


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_precache_docker_images())
    print("[ALDA Sandbox] Iniciando pre-cacheo de imágenes Docker en segundo plano...")
    yield
    if not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


import models, database

app = FastAPI(title="ALDA Backend API", lifespan=lifespan)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "https://alda-upt.sytes.net,http://localhost:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import auth, admin, teacher, student


@app.get("/api/health", tags=["Operaciones"])
def healthcheck():
    """Readiness probe used by Docker and Dokploy."""
    with database.engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    chroma_host = os.getenv("CHROMA_HOST", "chroma")
    chroma_port = int(os.getenv("CHROMA_PORT", "8000"))
    with socket.create_connection((chroma_host, chroma_port), timeout=2):
        pass
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(teacher.router)
app.include_router(student.router)
