import {
  LayoutGrid, FilePlus2, History, BookMarked,
  Sparkles, Settings, Plus, Home, FileText,
  ExternalLink, LogOut, Globe, X,
} from 'lucide-react';
import { useAuth }     from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const APP_NAV_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',     icon: LayoutGrid },
  { id: 'ai-advisor',     label: 'AI Advisor',     icon: Sparkles   },
  { id: 'new-simulation', label: 'New Simulation', icon: FilePlus2  },
  { id: 'history',        label: 'History',        icon: History    },
  { id: 'saved-reports',  label: 'Saved Reports',  icon: BookMarked },
  { id: 'gallery',        label: 'Gallery',        icon: Globe      },
];

const PUBLIC_NAV_ITEMS = [
  { id: 'landing',       label: 'Landing Page', icon: Home     },
  { id: 'sample-report', label: 'Report',       icon: FileText },
];

/**
 * Sidebar
 *
 * Props:
 *   activeItem      — currently active nav id
 *   onNavigate      — called with nav id when an item is clicked
 *   onGetStarted    — called when "New Simulation" CTA is clicked
 *   className       — extra class (used by layout to show/hide desktop vs mobile)
 *   isMobileDrawer  — renders as a slide-in drawer
 *   isOpen          — whether the mobile drawer is open
 *   onClose         — called when the close (×) button is clicked
 */
export default function Sidebar({
  activeItem = 'dashboard',
  onNavigate,
  onGetStarted,
  className = '',
  isMobileDrawer = false,
  isOpen = false,
  onClose,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : (user?.firstName?.[0] ?? 'U').toUpperCase();

  function handleLogout() {
    logout('/login');
  }

  // For mobile drawer: when a nav item is clicked, also close the drawer
  function handleNav(id) {
    onNavigate?.(id);
  }

  const drawerClass = isMobileDrawer
    ? `sidebar sidebar--drawer ${isOpen ? 'sidebar--drawer-open' : ''} ${className}`
    : `sidebar ${className}`;

  return (
    <aside className={drawerClass} aria-label="Application navigation">
      {/* ── Brand + mobile close button ─────────────────────────────────── */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          <Sparkles size={14} strokeWidth={2} />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-name">FuturePath AI</span>
          <span className="sidebar__brand-tagline">Instrument-Grade Simulation</span>
        </div>

        {/* Close button — only rendered inside the mobile drawer */}
        {isMobileDrawer && (
          <button
            type="button"
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ── App nav ─────────────────────────────────────────────────────── */}
      <p className="sidebar__section-label">App</p>
      <nav className="sidebar__nav" aria-label="App navigation">
        {APP_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar__nav-item ${activeItem === id ? 'is-active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__divider" aria-hidden="true" />

      {/* ── Pages nav ───────────────────────────────────────────────────── */}
      <p className="sidebar__section-label">Pages</p>
      <nav className="sidebar__nav" aria-label="Public pages">
        {PUBLIC_NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`sidebar__nav-item sidebar__nav-item--external ${activeItem === id ? 'is-active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
            <ExternalLink size={11} strokeWidth={2} className="sidebar__external-icon" />
          </button>
        ))}
      </nav>

      <div className="sidebar__divider" aria-hidden="true" />

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <button
        type="button"
        className={`sidebar__nav-item ${activeItem === 'settings' ? 'is-active' : ''}`}
        onClick={() => handleNav('settings')}
      >
        <Settings size={17} strokeWidth={2} />
        <span>Settings</span>
      </button>

      {/* ── New Simulation CTA ──────────────────────────────────────────── */}
      <button type="button" className="sidebar__cta" onClick={onGetStarted}>
        <Plus size={15} strokeWidth={2.5} />
        New Simulation
      </button>

      {/* ── User strip ──────────────────────────────────────────────────── */}
      {user && (
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">{initials}</div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">
              {user.firstName || user.name?.split(' ')[0] || 'User'}
            </span>
            {user.roles?.includes('PREMIUM') && (
              <span className="sidebar__user-role">Premium</span>
            )}
            {user.roles?.includes('ADMIN') && (
              <span className="sidebar__user-role sidebar__user-role--admin">Admin</span>
            )}
          </div>
          <button
            type="button"
            className="sidebar__logout-btn"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      )}
    </aside>
  );
}
