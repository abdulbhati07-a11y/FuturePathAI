import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider }         from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import ErrorBoundary             from './components/ErrorBoundary';

// Layout — not lazy so the shell renders instantly after auth check
import AppLayout from './layouts/AppLayout';

// Pages — each loads in its own chunk; Three.js / heavy deps stay out of the initial bundle
const LandingPage           = lazy(() => import('./pages/LandingPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/RegisterPage'));
const DashboardPage         = lazy(() => import('./pages/DashboardPage'));
const NewSimulationPage     = lazy(() => import('./pages/NewSimulationPage'));
const ResultsPage           = lazy(() => import('./pages/ResultsPage'));
const HistoryPage           = lazy(() => import('./pages/HistoryPage'));
const ReportsPage           = lazy(() => import('./pages/ReportsPage'));
const AdvisorPage           = lazy(() => import('./pages/AdvisorPage'));
const SettingsPage          = lazy(() => import('./pages/SettingsPage'));
const LegalPage             = lazy(() => import('./pages/LegalPage'));
const AboutPage             = lazy(() => import('./pages/AboutPage'));
const GalleryPage           = lazy(() => import('./pages/GalleryPage'));
const SimulationComparePage = lazy(() => import('./pages/SimulationComparePage'));
const AdminAnalyticsPage    = lazy(() => import('./pages/AdminAnalyticsPage'));

// TanStack Query client: 30 s stale time, exponential-backoff retries up to 10 s
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

// Full-screen spinner shown while a lazy route chunk is loading
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-root)', color: 'var(--text-secondary)',
      fontSize: '13px', gap: '10px',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: '50%',
        border: '2px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * AppAuthListener — must live inside BrowserRouter to call useNavigate.
 * Wires the AuthContext navigateRef and shows a session-expired toast on 401.
 */
function AppAuthListener() {
  const navigate    = useNavigate();
  const { navigateRef } = useAuth();
  const { toast }   = useToast();

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate, navigateRef]);

  useEffect(() => {
    function onUnauthorized() {
      toast('Your session has expired. Please sign in again.', {
        type: 'warning', duration: 4000,
      });
    }
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [toast]);

  return null;
}

/* ─── Protected Route ──────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-root)', color: 'var(--text-secondary)',
        fontSize: '13px', gap: '10px',
      }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
        }} />
        Loading…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return children;
}

/* ─── Router ───────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Public ─────────────────────────────────────── */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about"    element={<AboutPage />} />

        {/* Legal pages */}
        <Route path="/privacy"     element={<LegalPage />} />
        <Route path="/terms"       element={<LegalPage />} />
        <Route path="/cookies"     element={<LegalPage />} />
        <Route path="/legal/:page" element={<LegalPage />} />

        {/* Simulation results — public (shareable link) */}
        <Route path="/simulations/:simulationId/results" element={<ErrorBoundary><ResultsPage /></ErrorBoundary>} />

        {/* ── App shell (sidebar + navbar) ──────────────── */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"           element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
          <Route path="simulations/new"     element={<ErrorBoundary><NewSimulationPage /></ErrorBoundary>} />
          <Route path="simulations/compare" element={<ErrorBoundary><SimulationComparePage /></ErrorBoundary>} />
          <Route path="history"             element={<ErrorBoundary><HistoryPage /></ErrorBoundary>} />
          <Route path="gallery"             element={<ErrorBoundary><GalleryPage /></ErrorBoundary>} />
          <Route path="reports"             element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
          <Route path="advisor"             element={<ErrorBoundary><AdvisorPage /></ErrorBoundary>} />
          <Route path="settings"            element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="profile"             element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="admin"               element={<ErrorBoundary><AdminAnalyticsPage /></ErrorBoundary>} />
        </Route>

        {/* ── 404 catch-all ──────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <AppAuthListener />
                <AppRoutes />
              </ErrorBoundary>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
