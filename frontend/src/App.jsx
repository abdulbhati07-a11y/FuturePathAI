import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider }         from './context/ThemeContext';
import { ToastProvider }         from './context/ToastContext';
import { useToast }              from './context/ToastContext';

// Pages
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import NewSimulationPage from './pages/NewSimulationPage';
import ResultsPage      from './pages/ResultsPage';
import HistoryPage      from './pages/HistoryPage';
import ReportsPage      from './pages/ReportsPage';
import AdvisorPage      from './pages/AdvisorPage';
import SettingsPage     from './pages/SettingsPage';
import LegalPage        from './pages/LegalPage';
import GalleryPage      from './pages/GalleryPage';

// Layout
import AppLayout from './layouts/AppLayout';

/**
 * AppAuthListener — lives inside BrowserRouter so it can call useNavigate.
 * Wires the AuthContext's navigateRef and shows a session-expired toast
 * when the apiClient fires the 'auth:unauthorized' event.
 */
function AppAuthListener() {
  const navigate   = useNavigate();
  const { navigateRef } = useAuth();
  const { toast }  = useToast();

  // Wire navigate into AuthContext so it can redirect from outside React
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate, navigateRef]);

  // Show a toast on 401 (before the redirect happens)
  useEffect(() => {
    function onUnauthorized() {
      toast('Your session has expired. Please sign in again.', {
        type:     'warning',
        duration: 4000,
      });
    }
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [toast]);

  return null; // renders nothing — side-effects only
}

/* ─── Protected Route ──────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    // Minimal full-screen spinner while we verify the stored token
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-root)', color: 'var(--text-secondary)',
        fontSize: '13px', gap: '10px',
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          borderTopColor: '#6366F1',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ─── Router ───────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────── */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Legal pages */}
      <Route path="/privacy" element={<LegalPage />} />
      <Route path="/terms"   element={<LegalPage />} />
      <Route path="/cookies" element={<LegalPage />} />
      {/* Parameterized legal route */}
      <Route path="/legal/:page" element={<LegalPage />} />

      {/* Simulation results is public (shareable link) */}
      <Route path="/simulations/:simulationId/results" element={<ResultsPage />} />

      {/* ── New Simulation (standalone — no sidebar) ───── */}
      <Route
        path="/app/simulations/new"
        element={
          <ProtectedRoute>
            <NewSimulationPage />
          </ProtectedRoute>
        }
      />

      {/* ── App shell (sidebar + navbar) ───────────────── */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Default: redirect /app → /app/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<DashboardPage />} />
        <Route path="history"    element={<HistoryPage />} />
        <Route path="gallery"    element={<GalleryPage />} />
        <Route path="reports"    element={<ReportsPage />} />
        <Route path="advisor"    element={<AdvisorPage />} />
        <Route path="settings"   element={<SettingsPage />} />
        {/* Profile page re-uses Settings for now */}
        <Route path="profile"    element={<SettingsPage />} />
      </Route>

      {/* ── 404 catch-all ──────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppAuthListener />
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
