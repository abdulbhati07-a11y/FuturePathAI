import { Activity, Check, Circle } from 'lucide-react';
import { relativeTime } from '../hooks/useNotifications';
import './AdvisorPanel.css';

function ChecklistItem({ label, done }) {
  return (
    <li className={`advisor-panel__checklist-item ${done ? 'is-done' : ''}`}>
      {done ? <Check size={14} strokeWidth={2.5} /> : <Circle size={14} strokeWidth={2} />}
      <span>{label}</span>
    </li>
  );
}

/* One row per category the user has actually run a simulation in.
   This slot used to hold a MARKET CORRELATION panel with a "● Live" badge,
   listing the S&P 500 Index, the NASDAQ Composite, the VIX ("Market fear/greed
   metric") and an "Interest Rate (Sim)", each with a percentage move that
   changed every two seconds. Those were `baseValue + (Math.random() - 0.5) *
   volatility`. This app has no market data feed, so rather than keep a panel of
   invented index moves on a page about financial decisions, the slot now shows
   the spread of the user's own simulations. */
function CategoryRow({ label, count, share }) {
  return (
    <div className="category-row">
      <div className="category-row__top">
        <span className="category-row__label">{label}</span>
        <span className="category-row__count">
          {count} <span className="category-row__share">· {share}%</span>
        </span>
      </div>
      <div className="category-row__track">
        <span className="category-row__fill" style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }} />
      </div>
    </div>
  );
}

export default function AdvisorPanel({ advisor, categories, totals, lastActivityAt, onDeepDive }) {
  if (!advisor) return null;

  const checklist = Array.isArray(advisor.checklist) ? advisor.checklist : [];
  const cats = Array.isArray(categories) ? categories : [];
  const lastSeen = lastActivityAt ? relativeTime(lastActivityAt) : '';

  return (
    <aside className="advisor-panel">
      <div className="advisor-panel__card">
        <div className="advisor-panel__head">
          <span className="advisor-panel__icon">
            <Activity size={16} strokeWidth={2} />
          </span>
          <div>
            {/* Was "AI Advisor" above a "Current Analysis Active · ● Live" line,
                over a message picked at random from five canned sentences. No
                model wrote any of it and nothing was running, so both the
                attribution and the live badge are gone. What is left is
                arithmetic over rows the user can open. */}
            <p className="advisor-panel__title">{advisor.title || 'Your decision summary'}</p>
            <p className="advisor-panel__status">{advisor.status}</p>
          </div>
        </div>

        <p className="advisor-panel__message">{advisor.message}</p>

        {checklist.length > 0 && (
          <div className="advisor-panel__checklist-box">
            <p className="advisor-panel__checklist-heading">NEXT-STEP CHECKLIST</p>
            <ul className="advisor-panel__checklist">
              {checklist.map((item) => (
                <ChecklistItem key={item.id} label={item.label} done={item.done} />
              ))}
            </ul>
          </div>
        )}

        <button type="button" className="advisor-panel__cta" onClick={onDeepDive}>
          Deep Dive with AI
        </button>
      </div>

      {cats.length > 0 && (
        <div className="advisor-panel__section">
          <div className="advisor-panel__section-head">
            <p className="advisor-panel__section-heading">YOUR SIMULATIONS BY CATEGORY</p>
          </div>
          <div className="advisor-panel__categories">
            {cats.map((c) => (
              <CategoryRow key={c.id} label={c.label} count={c.count} share={c.share} />
            ))}
          </div>
        </div>
      )}

      {/* Was a SIMULATION UPTIME of 99.95%, a LAST RECALC of "47s ago" and an
          ACTIVE CONNECTIONS count — three figures nothing measured. These two are
          read off the user's own rows, and the timestamp is phrased from the ISO
          stamp the API sent rather than invented here. */}
      {(lastSeen || Number.isFinite(totals?.simulations)) && (
        <div className="advisor-panel__meta">
          {lastSeen && (
            <div>
              <p className="advisor-panel__meta-label">LAST ACTIVITY</p>
              <p className="advisor-panel__meta-value">{lastSeen}</p>
            </div>
          )}
          {Number.isFinite(totals?.simulations) && (
            <div>
              <p className="advisor-panel__meta-label">PATHS ANALYSED</p>
              <p className="advisor-panel__meta-value">{totals.scored} / {totals.simulations}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
