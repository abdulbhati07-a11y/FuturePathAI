import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './PublicNav.css';

// `hash` links scroll within the landing page; `path` links are real routes.
// About used to be '#about', which scrolled to the inquiry form — the label
// promised a page about the company and the anchor delivered a contact form.
const SECTION_LINKS = [
  { label: 'Features', hash: '#features' },
  { label: 'Pricing',  hash: '#pricing'  },
  { label: 'About',    path: '/about'    },
];

export default function PublicNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { token, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  function handleLogout() {
    logout('/');
  }

  return (
    <header className="public-nav">
      {/* Brand */}
      <button type="button" className="public-nav__brand" onClick={() => navigate('/')}>
        <span className="public-nav__brand-icon"><Sparkles size={14} strokeWidth={2} /></span>
        FuturePath AI
      </button>

      {/* Desktop links */}
      <nav className="public-nav__links" aria-label="Primary">
        {SECTION_LINKS.map(({ label, hash, path }) => (
          path
            // A route, so navigate in-app rather than reloading the whole bundle.
            ? <button key={label} type="button" className={isActive(path) ? 'is-active' : ''}
                onClick={() => { navigate(path); setMenuOpen(false); }}>{label}</button>
            : <a key={label} href={location.pathname === '/' ? hash : `/${hash}`}>{label}</a>
        ))}

        <div className="public-nav__divider" aria-hidden="true" />

        <button
          type="button"
          className={isActive('/app/dashboard') ? 'is-active' : ''}
          onClick={() => { navigate('/app/dashboard'); setMenuOpen(false); }}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={isActive('/app/reports') ? 'is-active' : ''}
          onClick={() => { navigate('/app/reports'); setMenuOpen(false); }}
        >
          Report
        </button>
      </nav>

      {/* CTA actions */}
      <div className="public-nav__actions">
        {token ? (
          <>
            <button type="button" className="public-nav__signin" onClick={handleLogout}>
              Sign Out
            </button>
            <button type="button" className="public-nav__get-started" onClick={() => navigate('/app/dashboard')}>
              {user?.firstName || 'Dashboard'} →
            </button>
          </>
        ) : (
          <>
            <button type="button" className="public-nav__signin" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button type="button" className="public-nav__get-started" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        type="button"
        className="public-nav__mobile-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen(v => !v)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="public-nav__drawer" role="dialog" aria-label="Mobile navigation">
          <div className="public-nav__drawer-links">
            {SECTION_LINKS.map(({ label, hash, path }) => (
              path
                ? <button key={label} type="button"
                    onClick={() => { navigate(path); setMenuOpen(false); }}>{label}</button>
                : <a key={label} href={location.pathname === '/' ? hash : `/${hash}`}
                    onClick={() => setMenuOpen(false)}>{label}</a>
            ))}

            <div className="public-nav__drawer-divider" />

            <button type="button" onClick={() => { navigate('/app/dashboard'); setMenuOpen(false); }}>
              Dashboard
            </button>
            <button type="button" onClick={() => { navigate('/app/reports'); setMenuOpen(false); }}>
              Report
            </button>

            <div className="public-nav__drawer-divider" />

            {token ? (
              <button type="button" onClick={() => { handleLogout(); setMenuOpen(false); }}>
                Sign Out
              </button>
            ) : (
              <>
                <button type="button" onClick={() => { navigate('/login'); setMenuOpen(false); }}>
                  Sign In
                </button>
                <button type="button" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
