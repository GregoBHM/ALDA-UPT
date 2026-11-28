# Pruebas de ALDA-UPT

GitHub Actions ejecuta las suites en pushes a `main` y a ramas `qa/**` y en pull requests hacia `main`. Abre **Pruebas ALDA-UPT** para consultar el resumen y descargar el artefacto `resultados-pruebas-alda`, que incluye los dos XML JUnit y el resultado por caso en Markdown y CSV.

La matriz de 120 casos deriva de [CatalogoPruebas.md](https://github.com/GregoBHM/ALDA-UPT/blob/7e04aa09890e7b6ed498c2c19bebb6be311258e3/CatalogoPruebas.md). La columna `modo_documentado` conserva la clasificación original. El estado de CI se calcula con los XML generados en la ejecución. Una prueba puede cubrir varios casos y un caso puede tener varias verificaciones. La columna de alcance indica qué suite aportó el resultado.

## Entornos

- **Backend.** Pytest prueba servicios y endpoints. GitHub Actions levanta PostgreSQL y cada prueba que necesita persistencia usa un esquema temporal. Localmente se usa un archivo SQLite temporal por prueba si falta `ALDA_TEST_DATABASE_URL`. OAuth y el proveedor del tutor se simulan en los escenarios correspondientes.
- **Navegador.** Playwright usa el frontend compilado en Chromium con respuestas HTTP simuladas. Comprueba los controles y resultados visibles en perfiles de estudiante, docente y administrador.
- **Fallos esperados.** CP-46, CP-63 y CP-111 reproducen validaciones ausentes. Pytest registra el fallo esperado y obliga a actualizar el test si empieza a aprobar. El resumen conserva ese estado.
- **Pendientes.** El reporte identifica los casos sin resultados de CI. Las pruebas con el proveedor real del tutor, la aceptación pedagógica y los tiempos del sistema requieren evidencia del entorno correspondiente. El [procedimiento CU-07](cu07/README.md) describe cómo medir esos escenarios.

## Ejecutar localmente

Usa Python 3.12 y Node.js 24. Desde la raíz del repositorio, ejecuta el backend en una terminal.

```bash
mkdir -p qa-resultados
cd backend
python -m pip install -r requirements.txt pytest==9.2.0 httpx==0.28.1
python -m pytest -ra --junitxml=../qa-resultados/backend.xml
```

En otra terminal, desde la raíz, compila el frontend y déjalo en ejecución.

```bash
cd frontend
npm ci
VITE_API_URL=http://127.0.0.1:4173 npm run build
npx playwright install chromium
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Con el frontend abierto, ejecuta desde la raíz.

```bash
NODE_PATH="$PWD/frontend/node_modules" node --test \
  --test-reporter=spec --test-reporter-destination=stdout \
  --test-reporter=junit --test-reporter-destination=qa-resultados/browser.xml \
  qa/browser/flows.test.cjs
python qa/report.py qa-resultados/backend.xml qa-resultados/browser.xml qa-resultados
```
