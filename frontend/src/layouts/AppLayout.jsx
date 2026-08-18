import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar   from '../components/Sidebar';
import AppNavbar from '../components/AppNavbar';
import './AppLayout.css';

const PATH_TO_NAV_ID = {
  '/app/dashboard':           'dashboard',
  '/app/simulations/new':     'new-simulation',
  '/app/simulations/compare': 'new-simulation', // compare lives under simulations
  '/app/history':             'history',
  '/app/gallery':             'gallery',
  '/app/reports':             'saved-reports',
  '/app/advisor':             'ai-advisor',
  '/app/settings':            'settings',
  '/app/profile':             'settings',
  '/app/admin':               'admin',
};

const NAV_ID_TO_PATH = {
  'dashboard':      '/app/dashboard',
  'new-simulation': '/app/simulations/new',
  'history':        '/app/history',
  'gallery':        '/app/gallery',
  'saved-reports':  '/app/reports',
  'ai-advisor':     '/app/advisor',
  'settings':       '/app/settings',
  'admin':          '/app/admin',
  'landing':        '/',
  'sample-report':  '/app/reports',
};

const PATH_TO_TITLE = {
  '/app/dashboard':           'Dashboard',
  '/app/simulations/new':     'New Simulation',
  '/app/simulations/compare': 'Compare Simulations',
  '/app/history':             'Simulation History',
  '/app/gallery':             'Community Gallery',
  '/app/reports':             'Saved Reports',
  '/app/advisor':             'AI Advisor',
  '/app/settings':            'Settings',
  '/app/profile':             'Profile',
  '/app/admin':               'Admin Analytics',
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close drawer on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const activeItem =
    Object.entries(PATH_TO_NAV_ID)
      .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'dashboard';

  const pageTitle =
    Object.entries(PATH_TO_TITLE)
      .find(([path]) => location.pathname.startsWith(path))?.[1] ?? 'Dashboard';

  function handleNavigate(id) {
    navigate(NAV_ID_TO_PATH[id] ?? '/app/dashboard');
    setDrawerOpen(false);
  }

  function handleGetStarted() {
    navigate('/app/simulations/new');
    setDrawerOpen(false);
  }

  return (
    <div className="app-layout">
      {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="app-layout__backdrop"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ───────────────────────────────────────── */}
      <Sidebar
        activeItem={activeItem}
        onNavigate={handleNavigate}
        onGetStarted={handleGetStarted}
        onClose={() => setDrawerOpen(false)}
        isMobileDrawer
        isOpen={drawerOpen}
        className="app-layout__sidebar--mobile"
      />

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="app-layout__content">
        <AppNavbar
          pageTitle={pageTitle}
          onMenuToggle={() => setDrawerOpen(v => !v)}
          menuOpen={drawerOpen}
          activeItem={activeItem}
        />
        <div className="app-layout__page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
