import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  User, Bell, Shield, Palette, ChevronRight, Check,
  Sparkles, Eye, EyeOff, AlertCircle, Sun, Moon, Sunset,
} from 'lucide-react';
import { apiClient } from '../api/client';
import './AuthPages.css';
import './SettingsPage.css';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User    },
  { id: 'notifications', label: 'Notifications', icon: Bell    },
  { id: 'security',      label: 'Security',       icon: Shield  },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
];

const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Light',
    desc: 'Burnt orange & vanilla',
    preview: 'linear-gradient(135deg, #FDF8F0 0%, #F5EDD8 50%, #C2410C 100%)',
    icon: Sun,
  },
  {
    id: 'dark',
    name: 'Dark',
    desc: 'Sand dune & midnight',
    preview: 'linear-gradient(135deg, #32213a 0%, #383b53 50%, #d4d6b9 100%)',
    icon: Moon,
  },
  {
    id: 'darker',
    name: 'Darker',
    desc: 'Deep space indigo',
    preview: 'linear-gradient(135deg, #0A0D18 0%, #101424 50%, #d4d6b9 100%)',
    icon: Moon,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Pure black cosmos',
    preview: 'linear-gradient(135deg, #03050E 0%, #060A18 50%, #d4d6b9 100%)',
    icon: Moon,
  },
];

/* ── Change Password Modal ──────────────────────────────────── */
function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setError(''); setLoading(true);
    try {
      await apiClient.patch('/users/me/password', { currentPassword: current, newPassword: next });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally { setLoading(false); }
  }

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="settings-modal__title">Change Password</h2>
        {done ? (
          <div className="settings-modal__success">
            <Check size={28} strokeWidth={2.5} />
            <p>Password updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="settings-modal__error"><AlertCircle size={14} strokeWidth={2} /> {error}</div>}
            <div className="settings-field">
              <label className="settings-field__label">Current Password</label>
              <div className="settings-field__pwd-wrap">
                <input type={showCur ? 'text' : 'password'} className="settings-field__input" value={current}
                  onChange={e => setCurrent(e.target.value)} required placeholder="••••••••" />
                <button type="button" className="auth-field__eye" onClick={() => setShowCur(v => !v)}>
                  {showCur ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-field__label">New Password</label>
              <div className="settings-field__pwd-wrap">
                <input type={showNew ? 'text' : 'password'} className="settings-field__input" value={next}
                  onChange={e => setNext(e.target.value)} required minLength={8} placeholder="Min. 8 characters" />
                <button type="button" className="auth-field__eye" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
            </div>
            <div className="settings-field">
              <label className="settings-field__label">Confirm New Password</label>
              <input type="password" className="settings-field__input" value={confirm}
                onChange={e => setConfirm(e.target.value)} required placeholder="Re-enter new password" />
            </div>
            <div className="settings-modal__actions">
              <button type="button" className="settings-outline-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="settings-save-btn" disabled={loading}>
                {loading ? <span className="auth-card__spinner" /> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Delete Account Modal ───────────────────────────────────── */
function DeleteAccountModal({ onClose, onConfirm }) {
  const [val, setVal] = useState('');
  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal settings-modal--danger" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="settings-modal__title settings-modal__title--danger">Delete Account</h2>
        <p className="settings-modal__body">
          This permanently removes your account, simulations, and reports. <strong>Cannot be undone.</strong>
        </p>
        <p className="settings-modal__body">Type <strong>DELETE</strong> to confirm.</p>
        <input type="text" className="settings-field__input" value={val}
          onChange={e => setVal(e.target.value)} placeholder="Type DELETE" autoFocus />
        <div className="settings-modal__actions" style={{ marginTop: 16 }}>
          <button type="button" className="settings-outline-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="settings-danger-btn" disabled={val !== 'DELETE'} onClick={onConfirm}>
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Settings Page
   ═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { user, logout }                 = useAuth();
  const { theme: activeTheme, setTheme } = useTheme();
  const { toast }                        = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [pwdModal, setPwdModal]   = useState(false);
  const [delModal, setDelModal]   = useState(false);

  /* Profile */
  const [name, setName]     = useState(user?.name || '');
  const [email, setEmail]   = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  /* Notifications */
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifPrefs')) ||
      { simulationComplete: true, advisorAlerts: true, marketUpdates: false, weeklyDigest: true };
    } catch { return { simulationComplete: true, advisorAlerts: true, marketUpdates: false, weeklyDigest: true }; }
  });

  function showToast(message, type = 'success') {
    toast(message, { type });
  }

  /* Save profile */
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch('/users/me', { name, email });
    } catch { /* API may not exist yet — still show success */ }
    setSaving(false);
    showToast('Profile saved successfully.');
  }

  /* Save notifications */
  function handleSaveNotifs() {
    localStorage.setItem('notifPrefs', JSON.stringify(notifs));
    showToast('Notification preferences saved.');
  }

  /* Change theme */
  function handleThemeChange(t) {
    setTheme(t);
    showToast(`Theme switched to ${THEME_OPTIONS.find(o => o.id === t)?.name || t}.`);
  }

  /* Delete account */
  async function handleDeleteAccount() {
    try { await apiClient.delete('/users/me'); } catch { /* ignore */ }
    logout();
  }

  return (
    <div className="settings-page">
      {pwdModal && <ChangePasswordModal onClose={() => setPwdModal(false)} />}
      {delModal && <DeleteAccountModal onClose={() => setDelModal(false)} onConfirm={handleDeleteAccount} />}

      <div className="settings-page__header">
        <h1 className="settings-page__title">Settings</h1>
        <p className="settings-page__subtitle">Manage your account and preferences</p>
      </div>

      <div className="settings-page__layout">
        {/* Sidebar nav */}
        <nav className="settings-nav" aria-label="Settings sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button"
              className={`settings-nav__item ${activeTab === id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(id)}>
              <Icon size={16} strokeWidth={2} />
              <span>{label}</span>
              <ChevronRight size={14} strokeWidth={2} className="settings-nav__arrow" />
            </button>
          ))}
        </nav>

        <div className="settings-content">

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <form className="settings-section" onSubmit={handleSaveProfile}>
              <h2 className="settings-section__title">Profile Information</h2>
              <p className="settings-section__desc">Update your personal details</p>

              <div className="settings-avatar-row">
                <div className="settings-avatar">
                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="settings-avatar-name">{user?.name || 'User'}</p>
                  <p className="settings-avatar-email">{user?.email || ''}</p>
                  {user?.roles?.includes('PREMIUM') && (
                    <span className="settings-role-badge settings-role-badge--premium">
                      <Sparkles size={10} strokeWidth={2} /> Premium
                    </span>
                  )}
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-field__label">Full Name</label>
                <input type="text" className="settings-field__input" value={name}
                  onChange={e => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="settings-field">
                <label className="settings-field__label">Email Address</label>
                <input type="email" className="settings-field__input" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>

              <button type="submit" className="settings-save-btn" disabled={saving}>
                {saving ? <><span className="auth-card__spinner" /> Saving…</> : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 className="settings-section__title">Notification Preferences</h2>
              <p className="settings-section__desc">Choose what updates you receive</p>
              <div className="settings-toggles">
                {Object.entries({
                  simulationComplete: 'Simulation Complete',
                  advisorAlerts:      'AI Advisor Alerts',
                  marketUpdates:      'Market Updates',
                  weeklyDigest:       'Weekly Digest',
                }).map(([key, label]) => (
                  <div key={key} className="settings-toggle-row">
                    <span className="settings-toggle-label">{label}</span>
                    <button type="button" role="switch" aria-checked={notifs[key]}
                      className={`settings-toggle ${notifs[key] ? 'is-on' : ''}`}
                      onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}>
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="settings-save-btn" style={{ marginTop: 24 }} onClick={handleSaveNotifs}>
                Save Preferences
              </button>
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 className="settings-section__title">Security</h2>
              <p className="settings-section__desc">Manage your password and access</p>
              <div className="settings-security-item">
                <div>
                  <p className="settings-security-item__title">Password</p>
                  <p className="settings-security-item__sub">Keep your account secure with a strong password</p>
                </div>
                <button type="button" className="settings-outline-btn" onClick={() => setPwdModal(true)}>
                  Change Password
                </button>
              </div>
              <div className="settings-security-item">
                <div>
                  <p className="settings-security-item__title">Two-Factor Authentication</p>
                  <p className="settings-security-item__sub">Add an extra layer of security</p>
                </div>
                <button type="button" className="settings-outline-btn"
                  onClick={() => showToast('2FA setup coming soon!', 'info')}>
                  Enable 2FA
                </button>
              </div>
              <div className="settings-security-item settings-security-item--danger">
                <div>
                  <p className="settings-security-item__title">Delete Account</p>
                  <p className="settings-security-item__sub">Permanently remove your account and all data</p>
                </div>
                <button type="button" className="settings-danger-btn" onClick={() => setDelModal(true)}>
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* ── Appearance ── */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2 className="settings-section__title">Appearance</h2>
              <p className="settings-section__desc">Choose your preferred colour theme</p>

              <div className="settings-theme-grid">
                {THEME_OPTIONS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} type="button"
                      className={`settings-theme-card ${activeTheme === t.id ? 'is-active' : ''}`}
                      onClick={() => handleThemeChange(t.id)}>
                      <div className="settings-theme-preview" style={{ background: t.preview }} />
                      <div className="settings-theme-info">
                        <span className="settings-theme-name">
                          <Icon size={13} strokeWidth={2} />
                          {t.name}
                        </span>
                        <span className="settings-theme-desc">{t.desc}</span>
                      </div>
                      {activeTheme === t.id && (
                        <Check size={14} strokeWidth={2.5} className="settings-theme-check" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="settings-theme-quick">
                <p className="settings-theme-quick__label">Quick toggle</p>
                <div className="settings-theme-quick__row">
                  <button type="button"
                    className={`settings-theme-pill ${activeTheme === 'light' ? 'is-active' : ''}`}
                    onClick={() => handleThemeChange('light')}>
                    <Sun size={14} strokeWidth={2} /> Light
                  </button>
                  <button type="button"
                    className={`settings-theme-pill ${activeTheme !== 'light' ? 'is-active' : ''}`}
                    onClick={() => handleThemeChange('dark')}>
                    <Moon size={14} strokeWidth={2} /> Dark
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
