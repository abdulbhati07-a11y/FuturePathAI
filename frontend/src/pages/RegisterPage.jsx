import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import './AuthPages.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__orb auth-page__orb--1" />
      <div className="auth-page__orb auth-page__orb--2" />

      <div className="auth-card">
        <div className="auth-card__brand" onClick={() => navigate('/')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && navigate('/')}>
          <span className="auth-card__brand-icon"><Sparkles size={16} strokeWidth={2} /></span>
          <span className="auth-card__brand-name">FuturePath AI</span>
        </div>

        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">Start simulating smarter decisions</p>

        {error && (
          <div className="auth-card__error" role="alert">
            <AlertCircle size={14} strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              className="auth-field__input"
              placeholder="Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-field__label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
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
            <label className="auth-field__label" htmlFor="reg-pwd">Password</label>
            <div className="auth-field__pwd-wrap">
              <input
                id="reg-pwd"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                className="auth-field__input"
                placeholder="Min. 8 characters"
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
            {password && (
              <div className="auth-field__strength">
                <span className={`auth-field__strength-bar ${password.length >= 8 ? 'strong' : 'weak'}`} />
                <span className="auth-field__strength-label">
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="auth-card__submit" disabled={loading}>
            {loading ? (
              <span className="auth-card__spinner" />
            ) : (
              <>Create Account <ArrowRight size={15} strokeWidth={2.5} /></>
            )}
          </button>
        </form>

        <p className="auth-card__switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__switch-link">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
