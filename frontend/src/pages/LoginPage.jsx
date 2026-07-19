import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import './AuthPages.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(e) {
    e.preventDefault();
    setEmail('admin@futurepath.ai');
    setPassword('admin123');
  }

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-page__orb auth-page__orb--1" />
      <div className="auth-page__orb auth-page__orb--2" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-card__brand" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/')}>
          <span className="auth-card__brand-icon"><Sparkles size={16} strokeWidth={2} /></span>
          <span className="auth-card__brand-name">FuturePath AI</span>
        </div>

        <h1 className="auth-card__title">Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your decision engine</p>

        {error && (
          <div className="auth-card__error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              className="auth-field__input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <div className="auth-field__label-row">
              <label className="auth-field__label" htmlFor="login-pwd">Password</label>
            </div>
            <div className="auth-field__pwd-wrap">
              <input
                id="login-pwd"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="auth-field__input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-field__eye"
                onClick={() => setShowPwd(v => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-card__submit" disabled={loading}>
            {loading ? (
              <span className="auth-card__spinner" />
            ) : (
              <>Sign In <ArrowRight size={15} strokeWidth={2.5} /></>
            )}
          </button>
        </form>

        <div className="auth-card__demo">
          <button type="button" className="auth-card__demo-btn" onClick={fillDemo}>
            Use demo credentials
          </button>
        </div>

        <p className="auth-card__switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card__switch-link">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
