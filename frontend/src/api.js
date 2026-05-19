const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
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

export const askAssistant = (messages, code, language, laboratory_id = null, terminal_output = null) =>
  request('/api/student/assistant', {
    method: 'POST',
    headers: { 'X-User-ID': getUser().id },
    body: JSON.stringify({ messages, code, language, laboratory_id, terminal_output }),
  });

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
