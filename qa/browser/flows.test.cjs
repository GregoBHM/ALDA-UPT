const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');
const { chromium } = require('playwright');

const baseUrl = process.env.ALDA_BROWSER_URL || 'http://127.0.0.1:4173';
const userFor = (role) => ({
  id: `qa-${role}`, email: `${role}@example.test`, name: `Cuenta QA ${role}`, role, is_active: true,
});
let browser;

before(async () => {
  browser = await chromium.launch({ executablePath: process.env.ALDA_CHROMIUM_PATH });
});
after(async () => browser?.close());

async function dashboard(t, role, handleApi) {
  const context = await browser.newContext({ baseURL: baseUrl });
  t.after(() => context.close());
  const user = userFor(role);
  await context.addInitScript((account) => {
    sessionStorage.setItem('user', JSON.stringify(account));
  }, user);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== new URL(baseUrl).origin) return route.abort();
    if (!url.pathname.startsWith('/api/') && url.pathname !== '/docs') return route.continue();
    if (url.pathname === '/api/auth/me') return route.fulfill({ json: user });
    const result = await handleApi(url.pathname, request);
    if (result instanceof Error) return route.abort();
    if (result !== undefined) return route.fulfill({ json: result });
    if (url.pathname === '/api/student/announcements') return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { detail: 'Ruta ausente de los datos de prueba' } });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  await page.goto('/dashboard');
  return page;
}

test('CP-12 CP-42 muestra métricas e historial en el panel del estudiante', async (t) => {
  const page = await dashboard(t, 'student', (path) => {
    if (path.startsWith('/api/student/progress/')) {
      return {
        total_attempts: 1, independent_attempts: 1, attempts_with_ai: 0, solved_count: 1, total_labs: 2,
        recent_activity: [
          { id: 'attempt-1', laboratory_id: 'lab-1', lab_title: 'Sumar dos números',
            attempt_number: 1, is_passed: true, date: '2026-01-01T10:00:00Z' },
        ],
      };
    }
  });
  await page.getByRole('button', { name: 'Mis Avances', exact: true }).click();
  await page.getByRole('heading', { name: 'Mis Avances' }).waitFor();
  await page.getByText('1 / 2', { exact: true }).waitFor();
  await page.getByText('Sumar dos números', { exact: true }).waitFor();
});

test('CP-17 CP-19 muestra el catálogo, progreso y filtro por dificultad', async (t) => {
  const labs = [
    { id: 'lab-1', title: 'Sumar dos números', difficulty: 'easy', description: 'Reto QA', test_cases: [] },
    { id: 'lab-2', title: 'Ordenar números', difficulty: 'hard', description: 'Reto QA', test_cases: [] },
  ];
  const page = await dashboard(t, 'student', (path) => {
    if (path === '/api/student/labs') return labs;
    if (path.startsWith('/api/student/progress/')) {
      return { recent_activity: [{ laboratory_id: 'lab-1', is_passed: true }] };
    }
  });
  await page.getByRole('button', { name: 'Catálogo de Retos' }).click();
  const easy = page.getByRole('heading', { name: labs[0].title });
  const hard = page.getByRole('heading', { name: labs[1].title });
  await easy.waitFor();
  await hard.waitFor();
  await page.getByText(/Completado$/).waitFor();
  await page.getByRole('combobox').selectOption('hard');
  await easy.waitFor({ state: 'hidden' });
  await hard.waitFor();
});

test('CP-47 CP-72 publica un aviso y lo muestra al estudiante', async (t) => {
  const announcements = [];
  const page = await dashboard(t, 'teacher', (path, request) => {
    if (path !== '/api/teacher/announcements') return;
    if (request.method() === 'GET') return announcements;
    assert.equal(request.method(), 'POST');
    const created = { id: 'qa-ann-1', ...request.postDataJSON() };
    announcements.push(created);
    return created;
  });
  await page.getByRole('navigation').getByRole('button', { name: 'Notificaciones' }).click();
  await page.getByPlaceholder('Título de la notificación').fill('Aviso de laboratorio');
  await page.getByPlaceholder('Escribe el mensaje para los estudiantes...').fill('Traer ejercicios de práctica.');
  const sent = page.waitForRequest((request) =>
    request.method() === 'POST' && request.url().endsWith('/api/teacher/announcements'));
  await page.getByRole('button', { name: 'Publicar' }).click();
  assert.deepEqual((await sent).postDataJSON(), {
    title: 'Aviso de laboratorio', content: 'Traer ejercicios de práctica.',
  });
  await page.getByText('Aviso de laboratorio', { exact: true }).waitFor();

  const student = await dashboard(t, 'student', (path) => {
    if (path === '/api/student/announcements') return announcements;
  });
  await student.getByTitle('Notificaciones').click();
  await student.getByText('Aviso de laboratorio', { exact: true }).waitFor();
  await student.getByText('Traer ejercicios de práctica.', { exact: true }).waitFor();
});

test('CP-102 CP-107 actualiza el rol y el estado desde Gestión de Usuarios', async (t) => {
  const student = userFor('student');
  const page = await dashboard(t, 'admin', (path, request) => {
    if (path === '/api/admin/users') return [student];
    if (path === `/api/admin/users/${student.id}/role`) {
      assert.equal(request.method(), 'PUT');
      student.role = request.postDataJSON().role;
      return student;
    }
    if (path === `/api/admin/users/${student.id}/status`) {
      assert.equal(request.method(), 'PUT');
      student.is_active = request.postDataJSON().is_active;
      return student;
    }
  });
  await page.getByRole('button', { name: 'Gestión de Usuarios', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: student.email });
  const changeRole = page.waitForRequest((request) => request.url().endsWith('/role'));
  await row.getByRole('combobox').selectOption('teacher');
  assert.deepEqual((await changeRole).postDataJSON(), { role: 'teacher' });
  await page.getByText('Rol actualizado', { exact: true }).waitFor();
  await row.getByRole('button', { name: 'Activo', exact: true }).click();
  await row.getByRole('button', { name: 'Suspendido' }).waitFor();
  await row.getByRole('button', { name: 'Suspendido' }).click();
  await row.getByRole('button', { name: 'Activo', exact: true }).waitFor();
});


test('CP-97 muestra el estado y actualiza el conteo desde el panel', async (t) => {
  let assistantOnline = false;
  const page = await dashboard(t, 'admin', (path) => {
    if (path === '/docs') return {};
    if (path === '/api/admin/users') return [];
    if (path === '/api/student/assistant') return assistantOnline ? {} : new Error('Servicio sin conexión');
  });
  await page.getByRole('button', { name: 'Estado del Sistema', exact: true }).click();
  await page.getByRole('heading', { name: 'Estado del Sistema' }).waitFor();
  await page.getByText('2 / 3', { exact: true }).waitFor();
  await page.getByText('Offline', { exact: true }).waitFor();
  assistantOnline = true;
  await page.getByRole('button', { name: 'Verificar', exact: true }).click();
  await page.getByText('3 / 3', { exact: true }).waitFor();
  await page.getByText('Offline', { exact: true }).waitFor({ state: 'hidden' });
});
