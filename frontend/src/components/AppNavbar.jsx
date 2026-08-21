import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, ChevronDown, LogOut, Settings, User,
  Sparkles, Plus, X, Check, Moon, Sun,
  FileText, History, ArrowRight, Loader2, Menu,
} from 'lucide-react';
import { useAuth }         from '../context/AuthContext';
import { useTheme }        from '../context/ThemeContext';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useNotifications } from '../hooks/useNotifications';
import Logo                 from './Logo';
import './AppNavbar.css';

const APP_NAV_ITEMS = [
  { id: 'home',           label: 'Home',          path: '/' },
  { id: 'dashboard',      label: 'Dashboard',     path: '/app/dashboard' },
  { id: 'new-simulation', label: 'Chat',          path: '/app/simulations/new' },
  { id: 'history',        label: 'History',       path: '/app/history' },
  { id: 'saved-reports',  label: 'Reports',       path: '/app/reports' },
  { id: 'gallery',        label: 'Gallery',       path: '/app/gallery' },
  { id: 'ai-advisor',     label: 'AI Advisor',    path: '/app/advisor' },
];

export default function AppNavbar({ pageTitle, onMenuToggle, menuOpen, activeItem }) {
  const navigate  = useNavigate();
  const { user, logout, token } = useAuth();
  const { theme, toggleTheme } = useTheme();


  // ── Notifications ──────────────────────────────────────────────────────────
  // Real items derived from this user's own simulations; see useNotifications.
  const { items: notifications, unreadCount, loading: notifLoading,
          error: notifError, hiddenByPrefs: notifHidden,
          markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen]         = useState(false);
  const notifRef = useRef(null);

  // ── Profile dropdown ───────────────────────────────────────────────────────
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // ── Search state ───────────────────────────────────────────────────────────
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIdx,   setActiveIdx]   = useState(-1);  // keyboard navigation
  const searchInputRef = useRef(null);
  const searchBoxRef   = useRef(null);

  const { results, totalCount, loading: searchLoading } = useGlobalSearch(searchQuery);

  // Flatten results for keyboard nav
  const flatResults = [
    ...results.simulations.map(r => ({ ...r, group: 'simulations' })),
    ...results.reports.map(r => ({ ...r, group: 'reports' })),
  ];

  // ── Close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    function onMouseDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery('');
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      // ⌘K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQuery('');
        setActiveIdx(-1);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Escape — close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setActiveIdx(-1);
      }
      // Arrow keys inside search
      if (searchOpen && flatResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIdx(i => (i + 1) % flatResults.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIdx(i => (i <= 0 ? flatResults.length - 1 : i - 1));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (activeIdx >= 0 && flatResults[activeIdx]) {
            handleResultClick(flatResults[activeIdx]);
          } else {
            // Enter with no selection → go to History with query pre-filled
            commitSearch();
          }
        }
      } else if (searchOpen && e.key === 'Enter') {
        e.preventDefault();
        commitSearch();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, flatResults, activeIdx, searchQuery]);

  // Reset active index when results change
  useEffect(() => { setActiveIdx(-1); }, [searchQuery]);

  // ── Search actions ─────────────────────────────────────────────────────────
  /** Navigate to History page with the query pre-filled */
  function commitSearch() {
    const q = searchQuery.trim();
    setSearchOpen(false);
    setSearchQuery('');
    setActiveIdx(-1);
    if (q) {
      navigate(`/app/history?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/app/history');
    }
  }

  /** Navigate to a specific search result */
  function handleResultClick(result) {
    setSearchOpen(false);
    setSearchQuery('');
    setActiveIdx(-1);
    navigate(result.href);
  }

  function openSearch() {
    setSearchOpen(true);
    setSearchQuery('');
    setActiveIdx(-1);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  // Opening an item marks it read and goes to the simulation it is about, so the
  // dropdown is navigable rather than decorative.
  function openNotification(n) {
    markRead(n.id);
    setNotifOpen(false);
    if (n.href) navigate(n.href);
  }

  function handleLogout() {
    logout('/login');
    setProfileOpen(false);
  }

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'User';
  const initials  = user?.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : firstName[0]?.toUpperCase() ?? 'U';

  const showDropdown = searchOpen && (searchQuery.trim().length >= 2);

  return (
    <header className="app-navbar">
      {/* Left — hamburger (mobile) + page title */}
      <div className="app-navbar__left">
        {/* Hamburger — only visible on mobile via CSS */}
        <button
          type="button"
          className="app-navbar__hamburger"
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
        >
          {menuOpen
            ? <X    size={20} strokeWidth={2} />
            : <Menu size={20} strokeWidth={2} />
          }
        </button>
        <div className="app-navbar__brand-mobile">
          <Logo size={18} strokeWidth={2} />
        </div>
        
        {/* Desktop Navigation Links */}
        <nav className="app-navbar__desktop-nav" aria-label="Main navigation">
          {APP_NAV_ITEMS.map(({ id, label, path }) => (
            <button
              key={id}
              type="button"
              className={`app-navbar__nav-item ${activeItem === id ? 'is-active' : ''}`}
              onClick={() => navigate(path)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Center — search */}
      <div className="app-navbar__center" ref={searchBoxRef}>
        {searchOpen ? (
          <div className={`app-navbar__search-open ${showDropdown ? 'has-results' : ''}`}>
            {searchLoading
              ? <Loader2 size={15} strokeWidth={2} className="app-navbar__search-icon spinning" />
              : <Search  size={15} strokeWidth={2} className="app-navbar__search-icon" />
            }
            <input
              ref={searchInputRef}
              type="text"
              className="app-navbar__search-input"
              placeholder="Search simulations, reports…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                // Allow Enter/Arrow handling in the global listener above
                if (e.key === 'Enter') e.preventDefault();
              }}
              aria-label="Search"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
            />
            {searchQuery && (
              <button type="button" className="app-navbar__search-clear"
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}>
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
            <button type="button" className="app-navbar__search-close"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); setActiveIdx(-1); }}>
              <kbd className="app-navbar__kbd-esc">Esc</kbd>
            </button>
          </div>
        ) : (
          <button type="button" className="app-navbar__search-btn" onClick={openSearch}
            aria-label="Search (⌘K)">
            <Search size={15} strokeWidth={2} />
            <span>Search…</span>
            <kbd className="app-navbar__kbd">⌘K</kbd>
          </button>
        )}

        {/* ── Search results dropdown ──────────────────────────────────── */}
        {showDropdown && (
          <div className="app-navbar__search-dropdown" role="listbox" aria-label="Search results">
            {searchLoading && totalCount === 0 ? (
              <div className="app-navbar__search-state">
                <Loader2 size={16} strokeWidth={2} className="spinning" />
                <span>Searching…</span>
              </div>
            ) : totalCount === 0 ? (
              <div className="app-navbar__search-state">
                <Search size={16} strokeWidth={1.5} />
                <span>No results for "<strong>{searchQuery}</strong>"</span>
              </div>
            ) : (
              <>
                {/* Simulations group */}
                {results.simulations.length > 0 && (
                  <div className="app-navbar__search-group">
                    <p className="app-navbar__search-group-label">Simulations</p>
                    {results.simulations.map((r, i) => (
                      <SearchResultRow
                        key={r.id}
                        result={r}
                        isActive={activeIdx === i}
                        query={searchQuery}
                        onClick={() => handleResultClick(r)}
                      />
                    ))}
                  </div>
                )}

                {/* Reports group */}
                {results.reports.length > 0 && (
                  <div className="app-navbar__search-group">
                    <p className="app-navbar__search-group-label">Reports</p>
                    {results.reports.map((r, i) => {
                      const idx = results.simulations.length + i;
                      return (
                        <SearchResultRow
                          key={r.id}
                          result={r}
                          isActive={activeIdx === idx}
                          query={searchQuery}
                          onClick={() => handleResultClick(r)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Footer — "See all results" */}
                <button type="button" className="app-navbar__search-all" onClick={commitSearch}>
                  <History size={13} strokeWidth={2} />
                  See all results for "<strong>{searchQuery}</strong>"
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right — actions */}
      <div className="app-navbar__right">
        {/* Theme toggle */}
        <button type="button" className="app-navbar__icon-btn" onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          {theme === 'light' ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
        </button>

        {token ? (
          <>
            {/* New Simulation */}
            <button type="button" className="app-navbar__new-btn"
              onClick={() => navigate('/app/simulations/new')}>
              <Plus size={14} strokeWidth={2.5} />
              <span>New Simulation</span>
            </button>

            {/* Notifications */}
            <div className="app-navbar__notif-wrap" ref={notifRef}>
              <button type="button" className="app-navbar__icon-btn"
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
                onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}>
                <Bell size={17} strokeWidth={2} />
                {unreadCount > 0 && <span className="app-navbar__badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="app-navbar__dropdown app-navbar__dropdown--notif">
                  <div className="app-navbar__dropdown-head">
                    <span className="app-navbar__dropdown-title">Notifications</span>
                    {unreadCount > 0 && (
                      <button type="button" className="app-navbar__mark-all" onClick={markAllRead}>
                        <Check size={12} strokeWidth={2.5} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="app-navbar__notif-list">
                    {notifLoading ? (
                      <div className="app-navbar__notif-state">
                        <Loader2 size={15} strokeWidth={2} className="spinning" />
                        <span>Loading…</span>
                      </div>
                    ) : notifError ? (
                      /* An empty list and a failed request look identical to the
                         user unless we say which happened. */
                      <div className="app-navbar__notif-state">
                        <Bell size={15} strokeWidth={1.5} />
                        <span>{notifError}</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="app-navbar__notif-state">
                        <Bell size={15} strokeWidth={1.5} />
                        {/* "Nothing happened" and "you switched it off" are
                            different facts, so they get different sentences. */}
                        <span>{notifHidden > 0
                          ? `${notifHidden} ${notifHidden === 1 ? 'notification is' : 'notifications are'} hidden by your preferences. Change them in Settings → Notifications.`
                          : 'No activity yet. Run a simulation and its report will appear here.'}</span>
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id}
                        className={`app-navbar__notif-item ${!n.read ? 'is-unread' : ''} notif-type--${n.type}`}
                        onClick={() => openNotification(n)} role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && openNotification(n)}>
                        <div className="app-navbar__notif-dot" />
                        <div className="app-navbar__notif-body">
                          <p className="app-navbar__notif-title">{n.title}</p>
                          <p className="app-navbar__notif-text">{n.body}</p>
                          <span className="app-navbar__notif-time">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="app-navbar__profile-wrap" ref={profileRef}>
              <button type="button" className="app-navbar__profile-btn"
                onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
                aria-expanded={profileOpen}>
                <div className="app-navbar__avatar">{initials}</div>
                <span className="app-navbar__profile-name">{firstName}</span>
                <ChevronDown size={13} strokeWidth={2.5}
                  className={`app-navbar__chevron ${profileOpen ? 'is-open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="app-navbar__dropdown app-navbar__dropdown--profile">
                  <div className="app-navbar__profile-info">
                    <div className="app-navbar__avatar app-navbar__avatar--lg">{initials}</div>
                    <div>
                      <p className="app-navbar__profile-full">{user?.name || firstName}</p>
                      <p className="app-navbar__profile-email">{user?.email || ''}</p>
                      {user?.roles?.includes('PREMIUM') && (
                        <span className="app-navbar__role-badge app-navbar__role-badge--premium">
                          <Sparkles size={10} strokeWidth={2} /> Premium
                        </span>
                      )}
                      {user?.roles?.includes('ADMIN') && (
                        <span className="app-navbar__role-badge app-navbar__role-badge--admin">Admin</span>
                      )}
                    </div>
                  </div>
                  <div className="app-navbar__dropdown-divider" />
                  <button type="button" className="app-navbar__menu-item"
                    onClick={() => { setProfileOpen(false); navigate('/app/profile'); }}>
                    <User size={15} strokeWidth={2} /> Profile
                  </button>
                  <button type="button" className="app-navbar__menu-item"
                    onClick={() => { setProfileOpen(false); navigate('/app/settings'); }}>
                    <Settings size={15} strokeWidth={2} /> Settings
                  </button>
                  <div className="app-navbar__dropdown-divider" />
                  <button type="button" className="app-navbar__menu-item app-navbar__menu-item--danger"
                    onClick={handleLogout}>
                    <LogOut size={15} strokeWidth={2} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button type="button" className="app-navbar__signin-btn" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button type="button" className="app-navbar__new-btn" onClick={() => navigate('/register')}>
              <span>Get Started</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

/* ── Search result row ────────────────────────────────────────────────────── */
function highlightMatch(text, query) {
  if (!query?.trim() || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="app-navbar__search-highlight">{text.slice(idx, idx + query.trim().length)}</mark>
      {text.slice(idx + query.trim().length)}
    </>
  );
}

function SearchResultRow({ result, isActive, query, onClick }) {
  const Icon = result.type === 'report' ? FileText : History;
  return (
    <button
      type="button"
      role="option"
      aria-selected={isActive}
      className={`app-navbar__search-result ${isActive ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <div className="app-navbar__search-result-icon">
        <Icon size={14} strokeWidth={2} />
      </div>
      <div className="app-navbar__search-result-body">
        <span className="app-navbar__search-result-title">
          {highlightMatch(result.title, query)}
        </span>
        <span className="app-navbar__search-result-sub">{result.subtitle}</span>
      </div>
      <ArrowRight size={13} strokeWidth={2} className="app-navbar__search-result-arrow" />
    </button>
  );
}
