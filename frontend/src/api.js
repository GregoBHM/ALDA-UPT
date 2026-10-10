const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Redirige al login limpiando la sesión */
function _forceLogout() {
  sessionStorage.clear();
  window.location.href = '/auth';
}

// Rutas de autenticación donde NO se debe forzar logout en un 403
const AUTH_PATHS = ['/api/auth/login'];

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    // Sesión expirada o sin permisos → redirigir al login automáticamente
    // EXCEPTO para el endpoint de login, donde el 403 significa correo no autorizado
    if ((res.status === 401 || res.status === 403) && !AUTH_PATHS.includes(path)) {
      _forceLogout();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    return res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const getUser = () => JSON.parse(sessionStorage.getItem('user') || '{}');

export const authLogin = (email, name, avatar_url) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, name, avatar_url }),
  });

export const getDashboard = (email) =>
  request(`/api/student/dashboard/${encodeURIComponent(email)}`);

export const getLabs = () =>
  request('/api/student/labs');

export const getProgress = (email) =>
  request(`/api/student/progress/${encodeURIComponent(email)}`);

export const compileCode = (code, language, laboratory_id = null) =>
  request('/api/student/compile', {
    method: 'POST',
    headers: { 'X-User-ID': getUser().id },
    body: JSON.stringify({ code, language, laboratory_id }),
  });

export const askAssistant = (messages, code, language, laboratory_id = null, terminal_output = null, is_pasted = false) =>
  request('/api/student/assistant', {
    method: 'POST',
    headers: { 'X-User-ID': getUser().id },
    body: JSON.stringify({ messages, code, language, laboratory_id, terminal_output, is_pasted }),
  });

export const askAssistantStream = async (messages, code, language, laboratory_id = null, terminal_output = null, is_pasted = false, onChunk, onDone) => {
  const res = await fetch(`${BASE}/api/student/assistant/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-ID': getUser().id },
    body: JSON.stringify({ messages, code, language, laboratory_id, terminal_output, is_pasted }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    if (onChunk) onChunk(chunk, full);
  }
  if (onDone) onDone(full);
  return full;
};

export const getAdminUsers = (userId) =>
  request('/api/admin/users', {
    headers: { 'X-User-ID': userId },
  });

export const updateUserRole = (userId, targetId, role) =>
  request(`/api/admin/users/${targetId}/role`, {
    method: 'PUT',
    headers: { 'X-User-ID': userId },
    body: JSON.stringify({ role }),
  });

export const updateUserStatus = (userId, targetId, is_active) =>
  request(`/api/admin/users/${targetId}/status`, {
    method: 'PUT',
    headers: { 'X-User-ID': userId },
    body: JSON.stringify({ is_active }),
  });

export const deleteUser = (userId, targetId) =>
  request(`/api/admin/users/${targetId}`, {
    method: 'DELETE',
    headers: { 'X-User-ID': userId },
  });

export const runTests = (code, language, laboratory_id) =>
  request('/api/student/run-tests', {
    method: 'POST',
    headers: { 'X-User-ID': getUser().id },
    body: JSON.stringify({ code, language, laboratory_id }),
  });

export const getAllowedEmails = (userId) =>
  request('/api/admin/allowed-emails', {
    headers: { 'X-User-ID': userId },
  });

export const addAllowedEmail = (userId, email, note) =>
  request('/api/admin/allowed-emails', {
    method: 'POST',
    headers: { 'X-User-ID': userId },
    body: JSON.stringify({ email, note }),
  });

export const removeAllowedEmail = (userId, email) =>
  request(`/api/admin/allowed-emails/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { 'X-User-ID': userId },
  });

export const rateAttempt = (attemptId, rating, comment = null) =>
  request(`/api/student/attempts/${attemptId}/rate`, {
    method: 'PUT',
    headers: { 'X-User-ID': getUser().id },
    body: JSON.stringify({ rating, comment }),
  });

/** Sincroniza el perfil del usuario autenticado (detecta cambios de rol/estado) */
export const syncMe = (userId) =>
  request('/api/auth/me', { headers: { 'X-User-ID': userId } });

/** Obtiene los anuncios/notificaciones del estudiante */
export const getAnnouncements = (userId) =>
  request('/api/student/announcements', { headers: { 'X-User-ID': userId } });
