import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Shield, TrendingUp, ArrowRight, ArrowUp, ArrowDown,
  Activity, Check, Circle,
} from 'lucide-react';
import { getDashboardSummary } from '../api/dashboard';
import { relativeTime } from '../hooks/useNotifications';
import './AdvisorPage.css';

/*
 * The "Deep Dive with AI" destination, reached from the dashboard's advisor
 * panel and the sidebar. It used to open on two pieces of pure invention:
 *
 *   1. A "LIVE MARKET SIGNAL" — a green pulsing dot, a loading skeleton, and the
 *      line "Market volatility is up 12% this week. Consider reviewing your
 *      high-risk equities." It was a hardcoded string handed straight to a
 *      resolved Promise (`// no API client needed`); nothing was fetched and
 *      nothing was live. This app has no market data feed, and the dashboard's
 *      matching MARKET CORRELATION / "● Live" panel was removed for the same
 *      reason — so the whole "live signal" idea is gone rather than restyled.
 *
 *   2. Three "AI-Powered Insight" cards with fixed copy: "Tech sector showing
 *      12% upside", "Interest rate volatility may affect your investment path
 *      projections", "Your Career path shows 3 unexplored branches with high
 *      confidence scores". No model wrote them and the figures matched no
 *      account's data — the same cards showed to everyone.
 *
 * Everything below is read from /dashboard/summary, the endpoint that already
 * feeds the dashboard: aggregates over the signed-in user's own simulations and
 * the reports generated from them, each figure carrying the sample it was taken
 * over. The metrics are arithmetic, not a model's opinion, so nothing here is
 * badged "AI" or "live" — the AI runs when the user starts a simulation, which
 * is what the calls to action point at.
 */

/* Sample the average was taken over — printed on every card, because an average
   over two paths and one over twenty are different claims. Mirrors the note the
   dashboard's StatsGrid prints. */
function sampleNote(scored, total) {
  if (!Number.isFinite(scored) || scored <= 0) return 'Not analysed yet';
  const paths = `${scored} analysed ${scored === 1 ? 'path' : 'paths'}`;
  return Number.isFinite(total) && total > scored
    ? `${paths} of ${total} simulations`
    : paths;
}

/* Arrow = which way the latest reading moved; colour = whether that is good
   news for this metric. They are separate because they disagree for risk:
   climbing risk is an up arrow and bad news. `trend`/`sentiment` come straight
   from the API so the client invents no direction of its own. */
function TrendMark({ trend, sentiment }) {
  if (!trend || trend === 'stable') {
    return (
      <span className="advisor-insight-card__trend advisor-insight-card__trend--neutral">
        <Activity size={12} strokeWidth={2.5} aria-label="holding steady across your analysed paths" />
      </span>
    );
  }
  const Icon = trend === 'up' ? ArrowUp : ArrowDown;
  const tone = sentiment === 'good' ? 'good' : sentiment === 'bad' ? 'bad' : 'neutral';
  return (
    <span className={`advisor-insight-card__trend advisor-insight-card__trend--${tone}`}>
      <Icon size={12} strokeWidth={2.5} aria-label={`trending ${trend} across your analysed paths`} />
    </span>
  );
}

function InsightCard({ icon: Icon, label, value, unit, note, accent, trend, sentiment, onOpen }) {
  return (
    <button
      type="button"
      className="advisor-insight-card"
      style={{ '--accent': accent }}
      onClick={onOpen}
      title="See the analysed paths behind this figure"
    >
      <div className="advisor-insight-card__head">
        <span className="advisor-insight-card__icon">
          <Icon size={18} strokeWidth={2} />
        </span>
        <TrendMark trend={trend} sentiment={sentiment} />
      </div>
      <p className="advisor-insight-card__label">{label}</p>
      <p className="advisor-insight-card__value">
        {value}{unit ? <span className="advisor-insight-card__unit"> {unit}</span> : null}
      </p>
      <span className="advisor-insight-card__note">{note}</span>
    </button>
  );
}

function ChecklistItem({ label, done }) {
  return (
    <li className={`advisor-page__checklist-item ${done ? 'is-done' : ''}`}>
      {done ? <Check size={15} strokeWidth={2.5} /> : <Circle size={15} strokeWidth={2} />}
      <span>{label}</span>
    </li>
  );
}

/* Skeleton shown while /dashboard/summary is in flight. The old page faked this
   for ~0ms in front of a resolved-immediately Promise; here it stands in front
   of a real request. */
function AdvisorSkeleton() {
  return (
    <div className="advisor-page">
      <div className="advisor-page__hero advisor-page__hero--skeleton" />
      <div className="advisor-page__summary advisor-page__summary--skeleton" />
      <div className="advisor-page__cards">
        {[0, 1, 2].map(i => <div key={i} className="advisor-insight-card advisor-insight-card--skeleton" />)}
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getDashboardSummary();
        if (!isMounted) return;
        setSummary(data);
        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Something went wrong loading your advisor.');
        setStatus('error');
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (status === 'loading') return <AdvisorSkeleton />;

  if (status === 'error') {
    return (
      <div className="advisor-page">
        <div className="advisor-page__error-banner">
          <p>⚠ Couldn't load your advisor: {errorMessage}</p>
          <button type="button" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const advisor    = summary?.advisor ?? null;
  const stats      = summary?.stats ?? {};
  const totals     = summary?.totals ?? { simulations: 0, scored: 0 };
  const lastSeen   = summary?.lastActivityAt ? relativeTime(summary.lastActivityAt) : '';
  const strongest  = stats.strongest ?? null;

  // Only the metrics the user has actually scored render as cards; a null metric
  // (nothing analysed yet) is dropped, never shown as a zero.
  const cards = [];
  if (stats.confidence) {
    cards.push({
      id: 'confidence', icon: Sparkles, label: 'Average confidence',
      value: `${stats.confidence.value}%`, accent: 'var(--color-primary)',
      note: sampleNote(stats.confidence.scored, stats.confidence.total),
      trend: stats.confidence.trend, sentiment: stats.confidence.sentiment,
    });
  }
  if (stats.risk) {
    const v = stats.risk.value;
    const accent = v < 30 ? 'var(--color-success)' : v < 70 ? 'var(--color-warning)' : 'var(--color-danger)';
    cards.push({
      id: 'risk', icon: Shield, label: 'Average risk',
      value: v, unit: `/ 100${stats.risk.label ? ` · ${stats.risk.label}` : ''}`, accent,
      note: sampleNote(stats.risk.scored, stats.risk.total),
      trend: stats.risk.trend, sentiment: stats.risk.sentiment,
    });
  }
  if (stats.decision) {
    cards.push({
      id: 'decision', icon: TrendingUp, label: 'Average decision score',
      value: `${stats.decision.value}%`, accent: 'var(--color-success)',
      note: sampleNote(stats.decision.scored, stats.decision.total),
      trend: stats.decision.trend, sentiment: stats.decision.sentiment,
    });
  }

  const checklist = Array.isArray(advisor?.checklist) ? advisor.checklist : [];

  return (
    <div className="advisor-page">
      {/* Hero. The old sub-heading promised intelligence "synthesized from your
          simulations, market data, and decision patterns" — but there is no
          market data, so that clause is gone. */}
      <div className="advisor-page__hero">
        <div className="advisor-page__hero-badge">
          <Sparkles size={14} strokeWidth={2} />
          <span>Your decision intelligence</span>
        </div>
        <h1 className="advisor-page__hero-title">Your AI Advisor</h1>
        <p className="advisor-page__hero-sub">
          A running read-out of your own simulations and the reports they produced.
          When you want a fresh forecast, the AI deep-dive starts a new one.
        </p>
        <button
          type="button"
          className="advisor-page__hero-cta"
          onClick={() => navigate('/app/simulations/new')}
        >
          Start a Deep-Dive Simulation <ArrowRight size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* Decision summary — the real advisor payload the dashboard also shows.
          No "LIVE" badge and no pulsing dot: nothing here is a live feed. */}
      {advisor && (
        <div className="advisor-page__summary">
          <div className="advisor-page__summary-head">
            <span className="advisor-page__summary-icon">
              <Activity size={16} strokeWidth={2} />
            </span>
            <div>
              <p className="advisor-page__summary-title">{advisor.title || 'Your decision summary'}</p>
              {advisor.status && <p className="advisor-page__summary-status">{advisor.status}</p>}
            </div>
          </div>

          <p className="advisor-page__summary-msg">{advisor.message}</p>

          {strongest && (
            <button
              type="button"
              className="advisor-page__strongest"
              onClick={() => navigate(`/simulations/${strongest.simulationId}/results`)}
            >
              <span className="advisor-page__strongest-label">STRONGEST PATH SO FAR</span>
              <span className="advisor-page__strongest-title">{strongest.title}</span>
              <span className="advisor-page__strongest-score">
                {strongest.grade ? `${strongest.grade} · ` : ''}{strongest.value}%
                <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </button>
          )}

          {lastSeen && (
            <p className="advisor-page__summary-meta">Last activity {lastSeen}</p>
          )}
        </div>
      )}

      {/* Real metrics, one card per scored dimension. Clicking opens the paths
          the average was computed from. */}
      {cards.length > 0 && (
        <div className="advisor-page__cards">
          {cards.map(c => (
            <InsightCard key={c.id} {...c} onOpen={() => navigate('/app/history')} />
          ))}
        </div>
      )}

      {/* Next-step checklist — facts about the account, so each tick holds still. */}
      {checklist.length > 0 && (
        <div className="advisor-page__checklist-box">
          <p className="advisor-page__checklist-heading">NEXT-STEP CHECKLIST</p>
          <ul className="advisor-page__checklist">
            {checklist.map(item => (
              <ChecklistItem key={item.id} label={item.label} done={item.done} />
            ))}
          </ul>
        </div>
      )}

      {/* CTA strip */}
      <div className="advisor-page__cta-strip">
        <div>
          <p className="advisor-page__cta-heading">
            {totals.simulations === 0 ? 'Ready to run your first simulation?' : 'Want to model another decision?'}
          </p>
          <p className="advisor-page__cta-sub">
            Run a simulation to forecast a scenario in detail — that's where the AI does its work.
          </p>
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
