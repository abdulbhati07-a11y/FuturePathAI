import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './ExploredAlternatives.css';

export default function ExploredAlternatives({ alternatives }) {
  const navigate = useNavigate();

  if (!alternatives || alternatives.length === 0) return null;

  // Score → color
  function scoreCls(score) {
    if (score >= 70) return 'score--high';
    if (score >= 50) return 'score--mid';
    return 'score--low';
  }

  return (
    <section className="explored-alts">
      <div className="explored-alts__head">
        <h3 className="explored-alts__heading">Explored Alternatives</h3>
        <p className="explored-alts__sub">Click any path to run a new simulation</p>
      </div>
      <div className="explored-alts__list">
        {alternatives.map((alt) => (
          <button
            key={alt.id}
            type="button"
            className="explored-alts__row"
            onClick={() => navigate('/app/simulations/new', { state: { initialMessage: alt.title } })}
            title={`Simulate: ${alt.title}`}
          >
            <div className="explored-alts__row-body">
              <p className="explored-alts__title">{alt.title}</p>
              <p className="explored-alts__subtitle">{alt.subtitle}</p>
            </div>
            <div className="explored-alts__row-right">
              <span className={`explored-alts__score ${scoreCls(alt.score)}`}>{alt.score}</span>
              <ArrowRight size={14} strokeWidth={2} className="explored-alts__arrow" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
