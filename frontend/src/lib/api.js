// Single API door: every call attaches the JWT and normalizes errors.
// Backend contract lives in routes_db.md (base /api, Bearer token, JSON errors).

const API_BASE = '/api';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      msg = data.message || data.error || msg;
    } catch {
      // non-JSON error body
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getSession() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// After login, which screen owns this role?
// admin/accountant -> back-office suite, contact -> self-service portal.
export function homeViewFor(user) {
  if (!user) return 'landing';
  return user.role === 'contact' ? 'portal' : 'office';
}

export const money = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const today = () => new Date().toISOString().split('T')[0];
