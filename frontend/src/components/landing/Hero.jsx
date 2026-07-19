import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <section className="hero">
      <div className="hero__copy">
        <div className="hero__eyebrow">
          <span className="hero__eyebrow-dot" />
          AI-Powered Decision Intelligence
        </div>
        <h1 className="hero__title">
          Don't Guess Your Future.{' '}
          <span className="hero__title-accent">Simulate It.</span>
        </h1>
        <p className="hero__subtitle">
          Model the financial and personal impact of your biggest decisions
          before you make them — with instrument-grade precision.
        </p>
        <div className="hero__actions">
          <button
            type="button"
            className="hero__cta-primary"
            onClick={() => navigate(token ? '/app/simulations/new' : '/register')}
          >
            {token ? 'New Simulation' : 'Get Started Free'}
          </button>
          <button
            type="button"
            className="hero__cta-secondary"
            onClick={() => navigate(token ? '/app/dashboard' : '/login')}
          >
            {token ? 'Go to Dashboard →' : 'Sign In →'}
          </button>
        </div>

        <div className="hero__social-proof">
          <div className="hero__avatars">
            {['#6366F1','#10B981','#F59E0B','#EF4444'].map((c, i) => (
              <span key={i} className="hero__avatar-dot" style={{ background: c, zIndex: 4 - i }} />
            ))}
          </div>
          <span className="hero__social-text">Trusted by <strong>2,400+</strong> decision-makers</span>
        </div>
      </div>

      <div className="hero__visual" aria-hidden="true">
        <div className="hero__visual-card">
          <img src="/images/hero_mockup.png" alt="FuturePath AI Dashboard" />
          <div className="hero__brand-overlay">
            <span className="hero__brand-text">FuturePath AI</span>
          </div>
        </div>
        {/* Floating stat chips */}
        <div className="hero__chip hero__chip--1">
          <span className="hero__chip-dot hero__chip-dot--green" />
          <span>Confidence 94.2%</span>
        </div>
        <div className="hero__chip hero__chip--2">
          <span className="hero__chip-dot hero__chip-dot--purple" />
          <span>Risk Score: Low</span>
        </div>
      </div>
    </section>
  );
}
