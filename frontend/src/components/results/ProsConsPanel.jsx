import { CheckCircle2, AlertTriangle, ChevronDown, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toText, toArray, toScore, parseMoney, formatUSD } from './reportContent';
import './ProsConsPanel.css';

/**
 * A reason is a causal claim, not a quotation: `point` states the mechanism and
 * its consequence, `evidence` cites the user's own figures behind it, and
 * `watchFor` (risk side only) names the earliest signal that the risk is
 * arriving. Reports written before that shape existed stored plain strings, so
 * both forms render — a bare string simply becomes a point with no support.
 */

// Strict field read: the named keys or nothing. toText's last resort is "any
// string field on the object", which is the right behaviour for the claim — an
// unrecognised shape still has to show something — and the wrong behaviour for
// the two supporting lines, where it prints the claim a second time underneath
// itself. A legacy {title, description} risk had its title echoed as an "Early
// signal" that way.
const field = (obj, keys) => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
};

function ReasonsList({ items, variant }) {
  const Icon = variant === 'right' ? CheckCircle2 : AlertTriangle;
  const list = toArray(items)
    .map(item => {
      // A bare string is the whole reason. Nothing is invented under it.
      if (typeof item === 'string') return { point: item.trim(), evidence: '', watchFor: '' };
      if (!item || typeof item !== 'object') return { point: '', evidence: '', watchFor: '' };
      return {
        point: toText(item, ['point', 'reason', 'claim', 'title', 'text', 'label']),
        evidence: field(item, ['evidence', 'description', 'detail', 'support']),
        watchFor: variant === 'wrong' ? field(item, ['watchFor', 'signal', 'earlyWarning']) : '',
      };
    })
    // A supporting line that only repeats what is already above it is noise.
    .map(r => ({
      ...r,
      evidence: r.evidence === r.point ? '' : r.evidence,
      watchFor: r.watchFor === r.point || r.watchFor === r.evidence ? '' : r.watchFor,
    }))
    .filter(r => r.point || r.evidence);

  // The list used to be padded to three with "Not enough information to assess.",
  // which read as three findings. Nothing is padded now, so an analysis that
  // produced nothing has to say so.
  if (list.length === 0) {
    return (
      <p className="reasons-list__empty">
        {variant === 'right'
          ? 'No case in favour could be grounded in your answers.'
          : 'No risk could be grounded in your answers.'}{' '}
        Add more detail to the interview, then generate the report again.
      </p>
    );
  }

  return (
    <ul className={`reasons-list reasons-list--${variant}`}>
      {list.map((r, i) => (
        <li key={i}>
          <Icon size={15} strokeWidth={2} />
          <span className="reasons-list__text">
            <span className="reasons-list__point">{r.point || r.evidence}</span>
            {r.point && r.evidence && <span className="reasons-list__detail">{r.evidence}</span>}
            {r.watchFor && (
              <span className="reasons-list__watch">
                <span className="reasons-list__watch-label">Early signal</span>
                {r.watchFor}
              </span>
            )}
          </span>
        </li>
      ))}
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
