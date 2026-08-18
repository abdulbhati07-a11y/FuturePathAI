import { CheckCircle2, AlertTriangle, ChevronDown, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toText, toArray, toScore, parseMoney, formatUSD } from './reportContent';
import './ProsConsPanel.css';

function ReasonsList({ items, variant }) {
  const Icon = variant === 'right' ? CheckCircle2 : AlertTriangle;
  const list = toArray(items);
  return (
    <ul className={`reasons-list reasons-list--${variant}`}>
      {list.map((item, i) => {
        // A reason may be a plain string or an object like { reason, description }.
        const primary = toText(item, ['reason', 'title', 'text', 'label']);
        const detail =
          item && typeof item === 'object' && typeof item.description === 'string'
            && item.description.trim() && item.description !== primary
            ? item.description
            : '';
        return (
          <li key={i}>
            <Icon size={15} strokeWidth={2} />
            <span className="reasons-list__text">
              <span>{primary || detail}</span>
              {primary && detail && <span className="reasons-list__detail">{detail}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Facts & Figures, derived from this simulation's own report — never static.
 * Any figure the report doesn't support is dropped rather than filled in, so an
 * incomplete report shows fewer cards instead of invented ones.
 */
function buildFigures({ bestCase, mostLikely, worstCase, confidence }) {
  const figures = [];
  const prob = s => toScore(s?.probability);
  const pb = prob(bestCase), pl = prob(mostLikely), pw = prob(worstCase);
  const conf = toScore(confidence);

  if (conf !== null) {
    figures.push({
      label: 'Decision Confidence',
      value: `${Math.round(conf)}%`,
      note: 'From your answers and the outcome spread',
    });
  }
  if (pb !== null) {
    figures.push({ label: 'Upside Probability', value: `${Math.round(pb)}%`, note: 'Best-case scenario likelihood' });
  }
  if (pw !== null) {
    figures.push({ label: 'Downside Risk', value: `${Math.round(pw)}%`, note: 'Worst-case scenario likelihood' });
  }

  // Probability-weighted expected value across the three scenarios. Needs at
  // least one priced scenario, and weights are renormalized over exactly the
  // scenarios that have both a probability and a salary figure.
  const priced = [[pb, bestCase], [pl, mostLikely], [pw, worstCase]]
    .map(([p, s]) => ({ p, delta: parseMoney(s?.salaryDelta) }))
    .filter(x => x.p !== null && x.delta !== null);
  const weight = priced.reduce((sum, x) => sum + x.p, 0);
  if (priced.length > 0 && weight > 0) {
    const ev = priced.reduce((sum, x) => sum + (x.p / weight) * x.delta, 0);
    figures.push({
      label: 'Net Expected Value',
      value: formatUSD(ev),
      note: `Weighted across ${priced.length} scenario${priced.length === 1 ? '' : 's'}`,
    });
  }
  return figures;
}

export default function ProsConsPanel({ rightReasons, wrongReasons, bestCase, mostLikely, worstCase, confidence }) {
  const [showFigures, setShowFigures] = useState(false);
  const figures = buildFigures({ bestCase, mostLikely, worstCase, confidence });

  // Listen for PDF export events — expand figures so they appear in the PDF
  useEffect(() => {
    function onExpand()  { setShowFigures(true);  }
    function onCollapse(){ setShowFigures(false); }
    window.addEventListener('pdf:expand-all',   onExpand);
    window.addEventListener('pdf:collapse-all', onCollapse);
    return () => {
      window.removeEventListener('pdf:expand-all',   onExpand);
      window.removeEventListener('pdf:collapse-all', onCollapse);
    };
  }, []);

  return (
    <div className="pros-cons-panel">
      <div className="pros-cons-panel__grid">
        <div className="pros-cons-panel__col">
          <h3 className="pros-cons-panel__heading pros-cons-panel__heading--right">
            <CheckCircle2 size={16} strokeWidth={2} />
            Why This Could Be Right
          </h3>
          <ReasonsList items={rightReasons} variant="right" />
        </div>

        <div className="pros-cons-panel__col">
          <h3 className="pros-cons-panel__heading pros-cons-panel__heading--wrong">
            <AlertTriangle size={16} strokeWidth={2} />
            Why This Could Go Wrong
          </h3>
          <ReasonsList items={wrongReasons} variant="wrong" />
        </div>
      </div>

      {figures.length > 0 && (
        <button
          type="button"
          className="pros-cons-panel__toggle"
          onClick={() => setShowFigures((v) => !v)}
          aria-expanded={showFigures}
        >
          <BarChart2 size={14} strokeWidth={2} />
          {showFigures ? 'Hide Facts & Figures' : 'Show Facts & Figures'}
          <ChevronDown size={14} strokeWidth={2} className={showFigures ? 'is-open' : ''} />
        </button>
      )}

      {showFigures && figures.length > 0 && (
        <div className="pros-cons-panel__figures" aria-label="Facts and figures">
          {figures.map(f => (
            <div key={f.label} className="pros-cons-figure">
              <p className="pros-cons-figure__label">{f.label}</p>
              <p className="pros-cons-figure__value">{f.value}</p>
              <p className="pros-cons-figure__note">{f.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
