import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

// Serverless backend lives at /api/* on the same origin (see src/api/client.js).
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ''}/api`;

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);
  const navigateRef = useRef(null);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchMe(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearSession() {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  }

  async function fetchMe(tk, { retry = true } = {}) {
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      // Only the server saying "this token is no good" is grounds for signing
      // someone out. This used to clear the session on ANY failure, so a user
      // whose phone dropped to no bars for the one second the app booted, or who
      // reloaded during a 500, was silently logged out with a perfectly valid
      // token — and had to find their password again to get back to work.
      if (res.status === 401 || res.status === 403) {
        clearSession();
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setUser(body.data ?? body);
    } catch {
      // Network error, 5xx, or unparseable body: the token is probably fine, so
      // keep it. One retry covers the common transient case; if that fails too
      // we leave the session intact and let the next real API call decide — a
      // genuinely bad token will fire auth:unauthorized and clear it properly.
      if (retry) {
        await new Promise(r => setTimeout(r, 1200));
        return fetchMe(tk, { retry: false });
      }
    } finally {
      setLoading(false);
    }
  }

  // Listen for 401 events fired by apiClient
  useEffect(() => {
    function onUnauthorized() {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      } else {
        window.location.href = '/login';
      }
    }
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (e) {
      throw new Error('Network error — please check your connection.');
    }

    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error(`Server returned a non-JSON response (Status: ${res.status}). Ensure the API backend is running.`);
    }

    if (!res.ok || body.success === false) {
      throw new Error(body.message || 'Login failed');
    }
    const { accessToken, user: userData } = body.data ?? body;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    let res;
    try {
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
    } catch (e) {
      throw new Error('Network error — please check your connection.');
    }

    let body;
    try {
      body = await res.json();
    } catch {
      throw new Error(`Server returned a non-JSON response (Status: ${res.status}). Ensure the API backend is running.`);
    }

    if (!res.ok || body.success === false) {
      throw new Error(body.message || 'Registration failed');
    }
    const { accessToken, user: userData } = body.data ?? body;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback((redirectPath = '/login') => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    if (navigateRef.current) {
      navigateRef.current(redirectPath, { replace: true });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, navigateRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
