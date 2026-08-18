import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './FinalCta.css';

export default function FinalCta() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <section className="final-cta">
      <h2 className="final-cta__heading">Stop Wondering. Start Knowing.</h2>
      <button type="button" className="final-cta__button" onClick={() => navigate(token ? '/app/simulations/new' : '/register')}>
        Get Started Free
      </button>
    </section>
  );
}
