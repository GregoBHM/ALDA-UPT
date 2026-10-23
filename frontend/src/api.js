const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Redirige al login limpiando la sesión */
function _forceLogout() {
  sessionStorage.clear();
  window.location.href = '/auth';
}

async function request(path, options = {}) {
  const { allowedErrors = [], ...fetchOptions } = options;
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(fetchOptions.headers || {}) },
    });
    // Sesión expirada o sin permisos → redirigir al login automáticamente
    // (solo si la ruta no es de login/auth propiamente)
    if ((res.status === 401 || res.status === 403) && !allowedErrors.includes(res.status)) {
      _forceLogout();
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Error ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const authLogin = (google_access_token) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ google_access_token }),
    // No forzar logout si el backend rechaza (403 = no autorizado, 401 = token inválido, 503 = API externa caída)
    allowedErrors: [401, 403, 503],
  });

export const authLogout = () =>
  request('/api/auth/logout', { method: 'POST' });

export const getDashboard = (email) =>
  request(`/api/student/dashboard/${encodeURIComponent(email)}`);

export const getLabs = () =>
  request('/api/student/labs');

export const getProgress = (email) =>
  request(`/api/student/progress/${encodeURIComponent(email)}`);

export const compileCode = (code, language, laboratory_id = null) =>
  request('/api/student/compile', {
    method: 'POST',
    body: JSON.stringify({ code, language, laboratory_id }),
  });

export const askAssistant = (messages, code, language, laboratory_id = null, terminal_output = null, is_pasted = false) =>
  request('/api/student/assistant', {
    method: 'POST',
    body: JSON.stringify({ messages, code, language, laboratory_id, terminal_output, is_pasted }),
  });

export const askAssistantStream = async (messages, code, language, laboratory_id = null, terminal_output = null, is_pasted = false, onChunk, onDone) => {
  const res = await fetch(`${BASE}/api/student/assistant/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
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

export const getAdminUsers = () =>
  request('/api/admin/users');

export const updateUserRole = (_userId, targetId, role) =>
  request(`/api/admin/users/${targetId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });

export const updateUserStatus = (_userId, targetId, is_active) =>
  request(`/api/admin/users/${targetId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active }),
  });

export const deleteUser = (_userId, targetId) =>
  request(`/api/admin/users/${targetId}`, {
    method: 'DELETE',
  });

export const runTests = (code, language, laboratory_id) =>
  request('/api/student/run-tests', {
    method: 'POST',
    body: JSON.stringify({ code, language, laboratory_id }),
  });

export const getAllowedEmails = () =>
  request('/api/admin/allowed-emails');

export const addAllowedEmail = (_userId, email, note) =>
  request('/api/admin/allowed-emails', {
    method: 'POST',
    body: JSON.stringify({ email, note }),
  });

export const removeAllowedEmail = (_userId, email) =>
  request(`/api/admin/allowed-emails/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });

export const rateAttempt = (attemptId, rating, comment = null) =>
  request(`/api/student/attempts/${attemptId}/rate`, {
    method: 'PUT',
    body: JSON.stringify({ rating, comment }),
  });

/** Sincroniza el perfil del usuario autenticado (detecta cambios de rol/estado) */
export const syncMe = () =>
  request('/api/auth/me');

/** Obtiene los anuncios/notificaciones del estudiante */
export const getAnnouncements = () =>
  request('/api/student/announcements');
