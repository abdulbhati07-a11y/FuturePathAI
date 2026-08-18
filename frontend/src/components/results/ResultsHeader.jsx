import { RefreshCw } from 'lucide-react';
import { toScore } from './reportContent';
import './ResultsHeader.css';

// The verdict is whatever the decision score supports. Each one carries its own
// colour so a cautious result never reads as a green light.
const VERDICT_TONE = {
  'RECOMMENDED':       'recommend',
  'PROCEED WITH CARE': 'caution',
  'MIXED OUTLOOK':     'caution',
  'NOT RECOMMENDED':   'warn',
};

export default function ResultsHeader({
  title, date, overallRisk, riskScore, confidence, verdict, onRerun,
}) {
  // An unscored report sends null; toScore keeps that distinct from a real 0.
  const conf = toScore(confidence);
  const risk = toScore(riskScore);
  const confidencePct = conf === null ? 0 : Math.round(conf);
  const tone = VERDICT_TONE[verdict] ?? 'pending';

  return (
    <header className="results-header">
      <div className="results-header__top">
        <div>
          <h1 className="results-header__title">{title}</h1>
          <p className="results-header__date">
            {date ? `Simulation Finalized on ${date}` : 'Not finalized yet'}
          </p>
        </div>
        <button type="button" className="results-header__rerun" onClick={onRerun}>
          <RefreshCw size={14} strokeWidth={2} />
          Re-run Simulation
        </button>
      </div>

      <div className="results-header__scores">
        <div className="results-score-card">
          <span className="results-score-card__icon" aria-hidden="true">⬡</span>
          <div>
            <p className="results-score-card__label">OVERALL RISK</p>
            <p className="results-score-card__value">{overallRisk ?? 'Not assessed'}</p>
          </div>
        </div>

        <div className="results-score-card">
          <span className="results-score-card__icon" aria-hidden="true">⚠</span>
          <div>
            <p className="results-score-card__label">RISK SCORE</p>
            <p className="results-score-card__value">
              {risk === null ? '—' : `${Math.round(risk)}/100`}
            </p>
          </div>
        </div>

        <div className="results-score-card results-score-card--confidence">
          <div className="results-score-card__bar-row">
            <p className="results-score-card__label">CONFIDENCE SCORE</p>
            <p className="results-score-card__value">{conf === null ? '—' : `${confidencePct}%`}</p>
          </div>
          <div className="results-score-card__bar-track">
            <span className="results-score-card__bar-fill" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>

        <div className="results-score-card results-score-card--ai">
          <span className="results-score-card__icon" aria-hidden="true">✦</span>
          <div>
            <p className="results-score-card__label">AI VERDICT</p>
            <p className={`results-score-card__value results-score-card__value--${tone}`}>
              {verdict ?? 'PENDING'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
