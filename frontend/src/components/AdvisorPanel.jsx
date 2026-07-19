import { Sparkles, Check, Circle, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import './AdvisorPanel.css';

function ChecklistItem({ label, done }) {
  return (
    <li className={`advisor-panel__checklist-item ${done ? 'is-done' : ''}`}>
      {done ? <Check size={14} strokeWidth={2.5} /> : <Circle size={14} strokeWidth={2} />}
      <span>{label}</span>
    </li>
  );
}

function CorrelationRow({ label, changePercent, direction, description }) {
  const isUp = direction === 'up';
  return (
    <div className="correlation-row">
      <div className="correlation-row__top">
        <span className="correlation-row__label">{label}</span>
        <span className={`correlation-row__change ${isUp ? 'is-up' : 'is-down'}`}>
          {isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
          {Math.abs(changePercent)}%
        </span>
      </div>
      <div className="correlation-row__track">
        <span
          className={`correlation-row__fill ${isUp ? 'is-up' : 'is-down'}`}
          style={{ width: `${Math.min(Math.abs(changePercent) * 14, 100)}%` }}
        />
      </div>
      {description && (
        <span className="correlation-row__description">{description}</span>
      )}
    </div>
  );
}

export default function AdvisorPanel({ advisor, correlations, meta, onDeepDive }) {
  if (!advisor) return null;

  const isLive = advisor.status?.toLowerCase().includes('live') || advisor.status?.toLowerCase().includes('active');

  return (
    <aside className="advisor-panel">
      <div className="advisor-panel__card advisor-panel__card--live">
        <div className="advisor-panel__head">
          <span className="advisor-panel__icon">
            <Sparkles size={16} strokeWidth={2} />
          </span>
          <div>
            <p className="advisor-panel__title">AI Advisor</p>
            <div className="advisor-panel__status-row">
              <p className="advisor-panel__status">{advisor.status}</p>
              {isLive && <span className="advisor-panel__live-badge">● Live</span>}
            </div>
          </div>
        </div>

        <p className="advisor-panel__message">{advisor.message}</p>

        <div className="advisor-panel__checklist-box">
          <p className="advisor-panel__checklist-heading">NEXT-STEP CHECKLIST</p>
          <ul className="advisor-panel__checklist">
            {advisor.checklist.map((item) => (
              <ChecklistItem key={item.id} label={item.label} done={item.done} />
            ))}
          </ul>
        </div>

        <button type="button" className="advisor-panel__cta" onClick={onDeepDive}>
          Deep Dive with AI
        </button>
      </div>

      {correlations && correlations.length > 0 && (
        <div className="advisor-panel__section advisor-panel__section--live">
          <div className="advisor-panel__section-head">
            <p className="advisor-panel__section-heading">MARKET CORRELATION</p>
            <span className="advisor-panel__section-live">● Live</span>
          </div>
          <div className="advisor-panel__correlations">
            {correlations.map((c) => (
              <CorrelationRow key={c.id} {...c} />
            ))}
          </div>
        </div>
      )}

      {meta && (
        <div className="advisor-panel__meta advisor-panel__meta--live">
          <div>
            <p className="advisor-panel__meta-label">SIMULATION UPTIME</p>
            <p className="advisor-panel__meta-value">{meta.simulationUptime}%</p>
          </div>
          <div>
            <p className="advisor-panel__meta-label">LAST RECALC</p>
            <p className="advisor-panel__meta-value">{meta.lastRecalc}</p>
          </div>
          {meta.activeConnections && (
            <div>
              <p className="advisor-panel__meta-label">ACTIVE CONNECTIONS</p>
              <p className="advisor-panel__meta-value">{meta.activeConnections}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
