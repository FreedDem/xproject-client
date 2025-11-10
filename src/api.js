// src/api.js

// ----- База API -----
const normalizeBase = (s) => (s || '').replace(/\/+$/, '');

function detectBase() {
  const envBase =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) || '';

  if (envBase !== '') return normalizeBase(envBase);

  if (typeof window !== 'undefined' && window.location?.port === '5173') {
    return 'http://127.0.0.1:5174'; // dev
  }

  // prod: same-origin (проксируем /api на бэк)
  return '';
}

const API_BASE_RAW = detectBase();
const API_BASE = API_BASE_RAW === '/' ? '' : API_BASE_RAW;

// ===== ЛОГИ =====
console.log('[API] import.meta.env.VITE_API_BASE =', import.meta.env?.VITE_API_BASE);
console.log('[API] Detected API_BASE =', API_BASE);

// Перехват всех fetch-запросов, чтобы видеть адреса
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    console.log('[FETCH]', url);
    try {
      const res = await originalFetch(...args);
      console.log('[FETCH OK]', res.status, url);
      return res;
    } catch (err) {
      console.error('[FETCH ERR]', url, err);
      throw err;
    }
  };
}

// ===== Вспомогательные функции =====
const u = (p) => {
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${API_BASE}${path}`;
};

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ===== Универсальный запрос =====
async function request(path, opts = {}) {
  const res = await fetch(u(path), opts);

  // Ошибки
  if (!res.ok) {
    // Попробуем снять JSON, если он есть, иначе текст
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.message || JSON.stringify(errJson) || `HTTP ${res.status} on ${path}`);
    } else {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status} on ${path}`);
    }
  }

  // Успех
  if (res.status === 204) return null;               // No Content — норм для DELETE
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();

  // Если это не JSON и не 204 — вернём текст (если нужен)
  const text = await res.text().catch(() => '');
  return text || null;
}

// ===== Auth =====
export async function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

// ===== Tours (list/read/create/update/delete) =====
export async function fetchTours(params = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.expand) sp.set('expand', String(params.expand));

  const qs = sp.toString();
  const data = await request(`/api/tours${qs ? `?${qs}` : ''}`);
  return Array.isArray(data) ? data : data.items || [];
}

export async function listTours() {
  return fetchTours();
}

export async function createTour(payload, token) {
  return request('/api/tours', {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
}

export async function updateTour(id, payload, token) {
  return request(`/api/tours/${id}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
}

export async function deleteTour(id, token) {
  return request(`/api/tours/${id}`, {
    method: 'DELETE',
    headers: headers(token),
  });
}

// ===== Uploads =====
export async function uploadImages(files, token, folder) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('files', f));
  if (folder) fd.append('folder', folder); // <-- добавлено
  return request('/api/admin/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
}

export async function bookTour(payload) {
  // ожидается JSON: { name, phone, dates, people, tourId, message, ... }
  return request('/api/tours/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getTour(id, params = {}) {
  const sp = new URLSearchParams();
  if (params.expand) sp.set('expand', String(params.expand));
  const qs = sp.toString();
  return request(`/api/tours/${id}${qs ? `?${qs}` : ''}`);
}