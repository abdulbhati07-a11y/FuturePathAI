import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toText, toArray, toNumber } from './reportContent';
import './ExploredAlternatives.css';

export default function ExploredAlternatives({ alternatives }) {
  const navigate = useNavigate();

  const list = toArray(alternatives);
  if (list.length === 0) return null;

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
        {list.map((alt, i) => {
          const title = typeof alt === 'string' ? alt : toText(alt, ['title', 'name', 'label', 'option']);
          const subtitle = typeof alt === 'string' ? '' : toText(alt, ['subtitle', 'description', 'detail', 'summary']);
          const score = toNumber(alt?.score);
          return (
            <button
              key={alt?.id ?? i}
              type="button"
              className="explored-alts__row"
              onClick={() => navigate('/app/simulations/new', { state: { initialMessage: title } })}
              title={`Simulate: ${title}`}
            >
              <div className="explored-alts__row-body">
                <p className="explored-alts__title">{title}</p>
                <p className="explored-alts__subtitle">{subtitle}</p>
              </div>
              <div className="explored-alts__row-right">
                <span className={`explored-alts__score ${scoreCls(score)}`}>{score}</span>
                <ArrowRight size={14} strokeWidth={2} className="explored-alts__arrow" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
