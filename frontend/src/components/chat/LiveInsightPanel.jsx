import { Sparkles, TrendingUp } from 'lucide-react';
import './LiveInsightPanel.css';

/** A labelled horizontal gauge (0–100). */
function Gauge({ label, value, tone }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="live-insight__gauge">
      <div className="live-insight__gauge-head">
        <span>{label}</span>
        <span className="live-insight__gauge-val">{pct}%</span>
      </div>
      <div className="live-insight__gauge-track">
        <div
          className={`live-insight__gauge-fill live-insight__gauge-fill--${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LiveInsightPanel({ insight, metrics }) {
  // Render if we have either a textual insight or numeric metrics.
  if (!insight && !metrics) return null;

  return (
    <aside className="live-insight" aria-live="polite" aria-label="Live path insight">
      <div className="live-insight__heading">
        <span className="live-insight__dot" />
        <Sparkles size={13} strokeWidth={2} />
        <span>{insight?.label || 'LIVE PATH INSIGHT'}</span>
      </div>

      {insight?.message && (
        <p className="live-insight__message">{insight.message}</p>
      )}

      {metrics && (
        <div className="live-insight__metrics">
          <Gauge label="Model confidence" value={metrics.confidence ?? 0} tone="good" />
          <Gauge label="Unresolved risk" value={metrics.riskLevel ?? 0} tone="warn" />
        </div>
      )}

      <div className="live-insight__footer">
        <TrendingUp size={11} strokeWidth={2} />
        <span>
          {metrics?.answeredTurns
            ? `Sharpened by ${metrics.answeredTurns} answer${metrics.answeredTurns === 1 ? '' : 's'}`
            : 'Updating in real-time'}
        </span>
      </div>
    </aside>
  );
}
