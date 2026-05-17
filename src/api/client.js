// ──────────────────────────────────────────────
// src/api/client.js  —  Central HTTP client
// ──────────────────────────────────────────────
// Every API call goes through this file.
// It auto-attaches the JWT token and handles
// token refresh + 401 redirects in one place.
// ──────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

/**
 * Core fetch wrapper.
 * - Prepends API_BASE to the path
 * - Attaches Authorization header when a token exists
 * - Parses JSON responses automatically
 * - Redirects to /login on 401
 */
async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle 401
  if (res.status === 401) {
    // Auth endpoints (login, register, etc.) should NOT trigger
    // the refresh flow — just surface the backend error directly.
    const isAuthEndpoint = path.startsWith('/auth/');

    if (!isAuthEndpoint) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = localStorage.getItem('accessToken');
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryRes = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (retryRes.status === 204) return null;
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({ message: retryRes.statusText }));
          throw new Error(err.message || 'Request failed');
        }
        return retryRes.json();
      }
      // Refresh failed — force login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    // Auth endpoint 401 — parse and throw the actual backend message
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Authentication failed');
  }

  // 204 No Content or empty 200
  if (res.status === 204) return null;

  // Other errors
  if (!res.ok) {
    const errText = await res.text();
    let errMessage = res.statusText;
    try {
      const err = JSON.parse(errText);
      errMessage = err.message || errMessage;
    } catch {}
    throw new Error(errMessage || `Request failed (${res.status})`);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

let refreshTokenPromise = null;

/**
 * Attempt to get a new access token using the refresh token.
 * Returns true if successful, false otherwise.
 * Uses a promise lock to prevent multiple concurrent refresh requests
 * when multiple API calls fail simultaneously.
 */
async function tryRefreshToken() {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  refreshTokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

// ─── Convenience methods ───────────────────────

export function get(path)              { return request(path); }
export function post(path, body)       { return request(path, { method: 'POST',   body: JSON.stringify(body) }); }
export function patch(path, body)      { return request(path, { method: 'PATCH',  body: JSON.stringify(body) }); }
export function del(path)              { return request(path, { method: 'DELETE' }); }

export default { get, post, patch, del };
