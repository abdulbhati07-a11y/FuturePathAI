import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
// no API client needed
import './AdvisorPage.css';

const INSIGHT_CARDS = [
  { icon: TrendingUp, title: 'Market Momentum', text: 'Tech sector showing 12% upside — review your equity simulations.', color: 'var(--color-success)' },
  { icon: Shield,     title: 'Risk Alert',      text: 'Interest rate volatility may affect your investment path projections.', color: 'var(--color-warning)' },
  { icon: Zap,        title: 'Opportunity',     text: 'Your Career path shows 3 unexplored branches with high confidence scores.', color: 'var(--color-primary)' },
];

export default function AdvisorPage() {
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve({ message: 'Market volatility is up 12% this week. Consider reviewing your high-risk equities.', type: 'warning' })
      .then(data => setInsight(data))
      .catch(() => setInsight({ message: 'Market volatility is up 12% this week. Consider reviewing your high-risk equities.', type: 'warning' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="advisor-page">
      {/* Hero */}
      <div className="advisor-page__hero">
        <div className="advisor-page__hero-badge">
          <Sparkles size={14} strokeWidth={2} />
          <span>AI-Powered Insights</span>
        </div>
        <h1 className="advisor-page__hero-title">Your AI Advisor</h1>
        <p className="advisor-page__hero-sub">
          Real-time intelligence synthesized from your simulations, market data, and decision patterns.
        </p>
        <button
          type="button"
          className="advisor-page__hero-cta"
          onClick={() => navigate('/app/simulations/new')}
        >
          Start a Deep-Dive Simulation <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* Live message */}
      <div className="advisor-page__live">
        <div className="advisor-page__live-head">
          <span className="advisor-page__live-dot" />
          <span className="advisor-page__live-label">LIVE MARKET SIGNAL</span>
        </div>
        {loading ? (
          <div className="advisor-page__live-skeleton" />
        ) : (
          <p className="advisor-page__live-msg">{insight?.message}</p>
        )}
      </div>

      {/* Insight cards */}
      <div className="advisor-page__cards">
        {INSIGHT_CARDS.map(({ icon: Icon, title, text, color }) => (
          <button
            key={title}
            type="button"
            className="advisor-insight-card"
            style={{ '--accent': color }}
            onClick={() => navigate('/app/simulations/new')}
            title="Start a simulation for this insight"
          >
            <div className="advisor-insight-card__icon">
              <Icon size={18} strokeWidth={2} />
            </div>
            <h3 className="advisor-insight-card__title">{title}</h3>
            <p className="advisor-insight-card__text">{text}</p>
            <span className="advisor-insight-card__action">Run simulation →</span>
          </button>
        ))}
      </div>

      {/* CTA strip */}
      <div className="advisor-page__cta-strip">
        <div>
          <p className="advisor-page__cta-heading">Ready to act on these insights?</p>
          <p className="advisor-page__cta-sub">Run a simulation to model any of these scenarios in detail.</p>
        </div>
        <button
          type="button"
          className="advisor-page__cta-btn"
          onClick={() => navigate('/app/simulations/new')}
        >
          New Simulation <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
