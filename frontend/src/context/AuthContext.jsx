import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  // We store a navigate ref that gets wired up by the AppAuthListener component
  // (rendered inside BrowserRouter). AuthContext itself lives outside the router
  // so it can't call useNavigate() directly.
  const navigateRef = useRef(null);

  // ── Validate stored token on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchMe(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMe(tk) {
    try {
      const res = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      if (!res.ok) throw new Error('Unauthorized');
      const body = await res.json();
      setUser(body.data ?? body);
    } catch {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Listen for 401 events fired by apiClient ─────────────────────────────
  useEffect(() => {
    function onUnauthorized() {
      // Clear auth state
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);

      // Redirect to login (navigateRef is set by AppAuthListener below)
      if (navigateRef.current) {
        navigateRef.current('/login', { replace: true });
      } else {
        // Fallback if router isn't ready yet
        window.location.href = '/login';
      }
    }

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
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
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json();
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
