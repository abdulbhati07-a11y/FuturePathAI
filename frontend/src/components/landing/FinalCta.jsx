import { useNavigate } from 'react-router-dom';
import './FinalCta.css';

export default function FinalCta() {
  const navigate = useNavigate();

  return (
    <section className="final-cta">
      <h2 className="final-cta__heading">Stop Wondering. Start Knowing.</h2>
      <button type="button" className="final-cta__button" onClick={() => navigate('/app/simulations/new')}>
        Get Started Free
      </button>
    </section>
  );
}
