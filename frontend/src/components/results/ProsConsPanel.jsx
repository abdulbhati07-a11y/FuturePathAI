import { CheckCircle2, AlertTriangle, ChevronDown, BarChart2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import './ProsConsPanel.css';

function ReasonsList({ items, variant }) {
  const Icon = variant === 'right' ? CheckCircle2 : AlertTriangle;
  return (
    <ul className={`reasons-list reasons-list--${variant}`}>
      {items.map((item, i) => (
        <li key={i}>
          <Icon size={15} strokeWidth={2} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Static illustrative figures that appear when the toggle is clicked
const FIGURES = [
  { label: 'Decision Confidence', value: '94.2%', note: 'Based on 3 scenario branches' },
  { label: 'Upside Probability',  value: '22%',   note: 'Best-case scenario likelihood' },
  { label: 'Downside Risk',       value: '15%',   note: 'Worst-case scenario likelihood' },
  { label: 'Net Expected Value',  value: '+€34k', note: 'Across all weighted outcomes' },
];

export default function ProsConsPanel({ rightReasons, wrongReasons }) {
  const [showFigures, setShowFigures] = useState(false);

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

      {showFigures && (
        <div className="pros-cons-panel__figures" aria-label="Facts and figures">
          {FIGURES.map(f => (
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
