import { RefreshCw } from 'lucide-react';
import './ResultsHeader.css';

export default function ResultsHeader({ title, date, overallRisk, riskLabel, confidence, onRerun }) {
  return (
    <header className="results-header">
      <div className="results-header__top">
        <div>
          <h1 className="results-header__title">{title}</h1>
          <p className="results-header__date">Simulation Finalized on {date}</p>
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
            <p className="results-score-card__value">{riskLabel}</p>
          </div>
        </div>

        <div className="results-score-card">
          <span className="results-score-card__icon" aria-hidden="true">⚠</span>
          <div>
            <p className="results-score-card__label">RISK SCORE</p>
            <p className="results-score-card__value">{overallRisk}</p>
          </div>
        </div>

        <div className="results-score-card results-score-card--confidence">
          <div className="results-score-card__bar-row">
            <p className="results-score-card__label">CONFIDENCE SCORE</p>
            <p className="results-score-card__value">{confidence}%</p>
          </div>
          <div className="results-score-card__bar-track">
            <span className="results-score-card__bar-fill" style={{ width: `${confidence}%` }} />
          </div>
        </div>

        <div className="results-score-card results-score-card--ai">
          <span className="results-score-card__icon" aria-hidden="true">✦</span>
          <div>
            <p className="results-score-card__label">AI VERDICT</p>
            <p className="results-score-card__value results-score-card__value--recommend">RECOMMENDED</p>
          </div>
        </div>
      </div>
    </header>
  );
}
