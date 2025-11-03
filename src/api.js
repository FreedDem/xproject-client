// src/api.js

// ----- Определение базы API -----
const normalizeBase = (s) => (s || '').replace(/\/+$/, '');

const detectBase = () => {
  // 1) Явно указанная переменная окружения (приоритет)
  const envBase =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) || '';
  if (envBase) return normalizeBase(envBase);

  // 2) Dev (vite) → локальный бэкенд
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location || {};
    if (port === '5173') {
      return 'http://127.0.0.1:5174';
    }

    // 3) Прод: пробуем api.<host>
    //    Пример: xproject.travel -> https://api.xproject.travel
    //    www.xproject.travel -> https://api.xproject.travel
    const bareHost = (hostname || '').replace(/^www\./, '');
    if (bareHost && bareHost !== 'localhost') {
      return `${protocol}//api.${bareHost}`;
    }
  }

  // 4) Фоллбек: same-origin (если фронт и бэк на одном домене и /api проксируется)
  // Если у тебя именно такой случай — лучше задай VITE_API_BASE="/"
  return '';
};

const API_BASE = detectBase();

// Собираем абсолютный или относительный URL
const u = (p) => {
  const path = p.startsWith('/') ? p : `/${p}`;
  if (!API_BASE || API_BASE === '/') return path; // same-origin
  return `${API_BASE}${path}`;
};

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Универсальный запрос с нормальными ошибками
async function request(path, opts = {}) {
  const res = await fetch(u(path), opts);
  if (!res.ok) {
    let text = '';
    try {
      text = await res.text();
    } catch {}
    const msg = text || `HTTP ${res.status} on ${path}`;
    throw new Error(msg);
  }
  // Пытаемся распарсить JSON, иначе вернём текст
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// ===== Auth
export async function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
}

// ===== Tours (list/read/create/update/delete)
export async function fetchTours(params = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status); // published|draft|all
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));

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

// ===== Uploads
export async function uploadImages(files, token) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append('files', f));
  return request('/api/admin/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
}
