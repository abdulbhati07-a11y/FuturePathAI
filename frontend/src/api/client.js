/**
 * Base API client for FuturePath AI.
 *
 * Wraps fetch with:
 *   - Auto-attaches Bearer token from localStorage
 *   - Unwraps the standard envelope { success, data, message, errors }
 *   - 401 handling: fires a custom DOM event so AuthContext can logout + redirect
 *   - 403 / 404 / 5xx: throws with a human-readable message
 *
 * 401 flow (no React deps needed in this module):
 *   1. request() detects 401
 *   2. Clears accessToken from localStorage immediately
 *   3. Fires window event 'auth:unauthorized'
 *   4. AuthContext listener calls logout() + navigate('/login')
 *   5. Throws so the caller's try/catch still works (shows error state)
 */

// The serverless backend is mounted at /api/* on the same Vercel deployment as
// the frontend, so the default base is same-origin `/api`. VITE_API_BASE_URL can
// point at a different origin (e.g. a preview deployment) but must NOT include /api.
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api`;

// Debounce flag — only fire the event once per "session expiry" cycle,
// not once per concurrent in-flight request that all get 401.
let _unauthorizedFired = false;

function handleUnauthorized() {
  // Clear the stale token immediately
  localStorage.removeItem('accessToken');

  if (!_unauthorizedFired) {
    _unauthorizedFired = true;

    // Fire custom event — AuthContext listens and calls logout() + navigate
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));

    // Reset flag after a short delay so a fresh login can re-arm the handler
    setTimeout(() => { _unauthorizedFired = false; }, 3000);
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('accessToken');

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // Network failure (offline, CORS, etc.)
    const err = new Error('Network error — please check your connection.');
    err.status = 0;
    throw err;
  }

  // ── 204 No Content ─────────────────────────────────────────────────────────
  if (res.status === 204) return null;

  // ── 401 Unauthorized — token expired or invalid ────────────────────────────
  if (res.status === 401) {
    handleUnauthorized();
    const err = new Error('Session expired. Please sign in again.');
    err.status = 401;
    throw err;
  }

  // Parse body (best-effort — some error responses aren't JSON)
  const body = await res.json().catch(() => null);

  // ── Other non-2xx ──────────────────────────────────────────────────────────
  if (!res.ok || (body && body.success === false)) {
    const message = body?.message || httpMessage(res.status);
    const err = new Error(message);
    err.status  = res.status;
    err.errors  = body?.errors || [];
    throw err;
  }

  // ── Unwrap standard envelope { success, data } ─────────────────────────────
  // If data itself contains pagination { data: [...], meta: {...} } keep intact
  return body?.data !== undefined ? body.data : body;
}

/** Human-readable fallback messages for common HTTP status codes */
function httpMessage(status) {
  const MAP = {
    400: 'Bad request — please check your input.',
    403: 'You don\'t have permission to do that.',
    404: 'Resource not found.',
    409: 'A conflict occurred — this resource may already exist.',
    422: 'Validation failed — please check your input.',
    429: 'Too many requests — please slow down.',
    500: 'Server error — please try again later.',
    502: 'Service temporarily unavailable.',
    503: 'Service temporarily unavailable.',
  };
  return MAP[status] || `Request failed with status ${status}`;
}

export const apiClient = {
  get:    (path)          => request(path, { method: 'GET'    }),
  post:   (path, payload) => request(path, { method: 'POST',   body: JSON.stringify(payload) }),
  patch:  (path, payload) => request(path, { method: 'PATCH',  body: JSON.stringify(payload) }),
  put:    (path, payload) => request(path, { method: 'PUT',    body: JSON.stringify(payload) }),
  delete: (path)          => request(path, { method: 'DELETE' }),
};
