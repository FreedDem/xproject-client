// src/api.js
// БАЗА API:
// 1) Если задан VITE_API_BASE — используем его (прод/нестандартная среда).
// 2) Иначе если фронт крутится на :5173 (vite dev) — бьём на http://localhost:5174.
// 3) Иначе — same-origin (когда клиент раздаёт сам сервер).
const detectDevBase = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (port === '5173') return `${protocol}//${hostname}:5174`;
  }
  return '';
};

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  detectDevBase();

const u = (p) => `${API_BASE}${p.startsWith('/') ? p : `/${p}`}`;

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// ===== Auth
export async function adminLogin(password){
  const r = await fetch(u('/api/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if(!r.ok){
    const t = await r.text().catch(()=> '')
    throw new Error(t || 'Неверный пароль')
  }
  return r.json(); // { token }
}

// ===== Tours (list/read/create/update/delete)
export async function fetchTours(params = {}){
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status); // published|draft|all
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));

  const qs = sp.toString();
  const r = await fetch(u(`/api/tours${qs ? `?${qs}` : ''}`));
  if(!r.ok) throw new Error('Не удалось получить туры');
  const data = await r.json();
  return Array.isArray(data) ? data : (data.items || []);
}

// алиас для совместимости
export async function listTours(){ return fetchTours(); }

export async function createTour(payload, token){
  const r = await fetch(u('/api/tours'), {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateTour(id, payload, token){
  const r = await fetch(u(`/api/tours/${id}`), {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(payload),
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteTour(id, token){
  const r = await fetch(u(`/api/tours/${id}`), {
    method: 'DELETE',
    headers: headers(token),
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

// ===== Uploads
export async function uploadImages(files, token){
  const fd = new FormData();
  [...files].forEach(f => fd.append('files', f));
  const r = await fetch(u('/api/admin/upload'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd
  });
  if(!r.ok) throw new Error('Не удалось загрузить изображения');
  return r.json(); // { urls: [] }
}
