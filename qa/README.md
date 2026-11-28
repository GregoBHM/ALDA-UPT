# Pruebas de ALDA-UPT

Un solo workflow, [Pruebas automatizadas ALDA-UPT](../.github/workflows/alda-qa.yml), ejecuta las suites en pushes a `main` y a ramas `qa/**` y en pull requests hacia `main`. En **Summary**, cada CU contiene una sección desplegable **Verificaciones individuales**. El paso **Publicar resultados automatizados por caso de uso** también agrupa el registro por CU. Cada verificación muestra el nombre, estado (`PASSED`, `FAILED`, `XFAIL` o `SKIPPED`), duración y motivo. Más abajo se muestran los resultados agrupados por los 24 casos de uso. El artefacto `resultados-pruebas-alda` incluye `pruebas-individuales.csv`, los logs de pytest y Chromium, los XML JUnit y el reporte agrupado.

El [índice de pruebas previstas](automatizadas.md) enumera las 71 pruebas clasificadas como automatizadas en el [catálogo original](https://github.com/GregoBHM/ALDA-UPT/blob/7e04aa09890e7b6ed498c2c19bebb6be311258e3/CatalogoPruebas.md). La trazabilidad usa bloques de cinco CP por cada CU, desde CP-01 a CP-05 para CU-01 hasta CP-116 a CP-120 para CU-24. Las verificaciones que ya automatizan un caso originalmente manual también se muestran cuando tienen resultados.

## Visor para la sustentación

En una ejecución de GitHub Actions, descarga el artefacto `resultados-pruebas-alda`, extrae el ZIP y abre `index.html`. Selecciona un CU y pulsa un CP de la lista para ver su estado, la duración y qué comprueba cada variante. El enlace incorpora ambos IDs para regresar a la misma selección. En las pruebas de Chromium, las trazas ZIP están en `trazas/` dentro del mismo artefacto. Puedes abrir una con `npx playwright show-trace <archivo.zip>` desde `frontend`.

El mismo workflow publica el visor cuando GitHub Pages está configurado con **Settings → Pages → Source → GitHub Actions** y se ejecuta en `main` mediante un push o con **Actions → Pruebas automatizadas ALDA-UPT → Run workflow**. La página muestra resultados, tiempos y enlaces. Los logs completos y las trazas quedan en el artefacto de Actions.

## Agregar una prueba

En pytest, escribe el ID en el nombre del test como `test_cp61_...`. En navegador, incluye `CP-61` en el título. Si una prueba verifica requisitos de dos casos, incluye ambos IDs. El resumen lee los resultados JUnit y asigna cada comprobación a su CU. Los archivos de pruebas pueden organizarse por módulo o CU dentro de sus suites. El workflow se mantiene en un solo YAML.

## Entornos

- **Backend.** Pytest prueba servicios y endpoints. GitHub Actions levanta PostgreSQL y cada prueba que necesita persistencia usa un esquema temporal. Localmente se usa un archivo SQLite temporal por prueba si falta `ALDA_TEST_DATABASE_URL`. La suite del compilador ejecuta programas C++ de prueba con la imagen `gcc:12`. Para reproducirla localmente con Docker, ejecuta `docker pull gcc:12` antes de pytest. OAuth y el proveedor del tutor se simulan en los escenarios correspondientes.
- **Navegador.** Playwright usa el frontend compilado en Chromium con respuestas HTTP simuladas. Comprueba los controles y resultados visibles en perfiles de estudiante, docente y administrador.
- **Fallos esperados.** CP-46, CP-63 y CP-111 reproducen validaciones ausentes. Pytest registra el fallo esperado y obliga a actualizar el test si empieza a aprobar. El resumen conserva ese estado.
- **Pendientes.** El resumen cuenta los casos previstos sin resultados de CI y enlaza al índice. Las pruebas con el proveedor real del tutor, la aceptación pedagógica y los tiempos del sistema requieren evidencia del entorno correspondiente. El [procedimiento CU-07](cu07/README.md) describe cómo medir esos escenarios.

## Ejecutar localmente

Usa Python 3.12 y Node.js 24. Desde la raíz del repositorio, ejecuta el backend en una terminal.

```bash
mkdir -p qa-resultados
cd backend
python -m pip install -r requirements.txt pytest==9.2.0 httpx==0.28.1
python -m pytest -v -ra -o junit_logging=out-err --junitxml=../qa-resultados/backend.xml
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
