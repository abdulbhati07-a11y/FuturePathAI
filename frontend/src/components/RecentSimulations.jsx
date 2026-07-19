import { useNavigate } from 'react-router-dom';
import { FilePlus2, ArrowRight } from 'lucide-react';
import './RecentSimulations.css';

const TAG_STYLES = {
  'SAFE PATH':      'tag--safe',
  'PENDING ACTION': 'tag--pending',
};

function SimulationCard({ simulation, onReview }) {
  const {
    title, riskLevel, riskPercent,
    confidenceScore, decisionGrade, statusTag, updatedAt,
  } = simulation;

  return (
    <div className="sim-card">
      <div className="sim-card__main">
        <h3 className="sim-card__title">{title}</h3>
        {statusTag && (
          <span className={`sim-card__tag ${TAG_STYLES[statusTag] ?? ''}`}>{statusTag}</span>
        )}
        <p className="sim-card__updated">
          Updated:{' '}
          {updatedAt
            ? new Date(updatedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </p>
      </div>

      <div className="sim-card__metric">
        <span className="sim-card__metric-label">RISK LEVEL</span>
        <span className="sim-card__metric-value">{riskLevel ?? '—'}</span>
        {riskPercent != null && (
          <span className="sim-card__metric-sub">({riskPercent}%)</span>
        )}
      </div>

      <div className="sim-card__metric">
        <span className="sim-card__metric-label">CONFIDENCE</span>
        <span className="sim-card__metric-value">
          {confidenceScore != null ? `${confidenceScore}%` : '—'}
        </span>
      </div>

      <div className="sim-card__metric">
        <span className="sim-card__metric-label">SCORE</span>
        <span className="sim-card__metric-value">{decisionGrade ?? '—'}</span>
      </div>

      <button
        type="button"
        className="sim-card__review-btn"
        onClick={() => onReview?.(simulation.id)}
      >
        Review
      </button>
    </div>
  );
}

/* ── Empty state shown when simulations array is empty ────────────────────── */
function EmptyState({ onStart }) {
  return (
    <div className="recent-sims__empty">
      <div className="recent-sims__empty-icon">
        <FilePlus2 size={24} strokeWidth={1.5} />
      </div>
      <div className="recent-sims__empty-copy">
        <p className="recent-sims__empty-title">No simulations yet</p>
        <p className="recent-sims__empty-sub">
          Your completed simulations will appear here once you run your first one.
        </p>
      </div>
      <button type="button" className="recent-sims__empty-btn" onClick={onStart}>
        Start a Simulation
        <ArrowRight size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function RecentSimulations({ simulations, onViewAll, onReview, onStart }) {
  const navigate = useNavigate();
  const handleStart = onStart ?? (() => navigate('/app/simulations/new'));

  return (
    <section className="recent-sims">
      <div className="recent-sims__head">
        <div>
          <h2 className="recent-sims__title">Recent Simulations</h2>
          {simulations.length > 0 && (
            <p className="recent-sims__count">
              {simulations.length} simulation{simulations.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {simulations.length > 0 && (
          <button type="button" className="recent-sims__view-all" onClick={onViewAll}>
            View All History
          </button>
        )}
      </div>

      {simulations.length === 0 ? (
        <EmptyState onStart={handleStart} />
      ) : (
        <div className="recent-sims__list">
          {simulations.map(sim => (
            <SimulationCard key={sim.id} simulation={sim} onReview={onReview} />
          ))}
        </div>
      )}
    </section>
  );
}
