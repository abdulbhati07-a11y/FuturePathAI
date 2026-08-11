import { useNavigate } from 'react-router-dom';
import { Sparkles, BarChart2, Shield, GitBranch, ArrowRight, Play } from 'lucide-react';
import { DECISION_CATEGORIES } from '../data/decisionLibrary';
import './DashboardOnboarding.css';

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Model Any Decision',
    desc: 'Simulate career pivots, investments, relocations and more with AI precision.',
    color: '#6366F1',
  },
  {
    icon: Shield,
    title: 'Quantified Risk Scores',
    desc: 'Every path comes with a transparent risk score and confidence rating.',
    color: '#10B981',
  },
  {
    icon: GitBranch,
    title: 'Compare Alternatives',
    desc: 'See best, most-likely, and worst-case scenarios side by side.',
    color: '#F59E0B',
  },
];

const SAMPLE_PROMPTS = DECISION_CATEGORIES;

export default function DashboardOnboarding({ firstName, onStart }) {
  const navigate = useNavigate();

  function handlePrompt(prompt) {
    // Navigate to new simulation — the chat page will use this as the opening message
    navigate('/app/simulations/new', { state: { initialMessage: prompt } });
  }

  return (
    <section className="onboarding" aria-label="Get started with FuturePath AI">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="onboarding__hero">
        {/* Ambient glow */}
        <div className="onboarding__glow" aria-hidden="true" />

        <div className="onboarding__hero-badge">
          <Sparkles size={13} strokeWidth={2} />
          <span>Welcome to FuturePath AI</span>
        </div>

        <h2 className="onboarding__hero-title">
          {firstName && firstName !== 'there'
            ? `Ready to simulate your future, ${firstName}?`
            : "Ready to simulate your future?"}
        </h2>

        <p className="onboarding__hero-sub">
          You haven't run any simulations yet. Start your first one and let AI model
          the real impact of your biggest life decisions — before you make them.
        </p>

        <button
          type="button"
          className="onboarding__hero-cta"
          onClick={onStart}
          autoFocus
        >
          <Play size={16} strokeWidth={2.5} />
          Start Your First Simulation
          <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Feature pills ─────────────────────────────────────────────────── */}
      <div className="onboarding__features">
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="onboarding__feature" style={{ '--feat-color': color }}>
            <div className="onboarding__feature-icon">
              <Icon size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="onboarding__feature-title">{title}</p>
              <p className="onboarding__feature-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Try a prompt ──────────────────────────────────────────────────── */}
      <div className="onboarding__prompts">
        <p className="onboarding__prompts-label">Or try one of these decisions:</p>
        {SAMPLE_PROMPTS.map(({ key, label, prompts }) => (
          <div key={key} className="onboarding__prompts-group">
            <p className="onboarding__prompts-cat">{label}</p>
            <div className="onboarding__prompts-grid">
              {prompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  className="onboarding__prompt-chip"
                  onClick={() => handlePrompt(prompt)}
                >
                  <span>{prompt}</span>
                  <ArrowRight size={13} strokeWidth={2} className="onboarding__prompt-arrow" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Social proof strip ────────────────────────────────────────────── */}
      <div className="onboarding__proof">
        <div className="onboarding__proof-avatars" aria-hidden="true">
          {['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((c, i) => (
            <span key={i} className="onboarding__proof-dot" style={{ background: c, zIndex: 5 - i }} />
          ))}
        </div>
        <p className="onboarding__proof-text">
          Join <strong>2,400+</strong> decision-makers already simulating smarter outcomes
        </p>
      </div>

    </section>
  );
}
