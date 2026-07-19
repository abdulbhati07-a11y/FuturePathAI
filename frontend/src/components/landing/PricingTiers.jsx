import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PricingTiers.css';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mo',
    features: ['3 simulations / month', 'Core decision engine', 'Email support'],
    cta: 'Get Started',
    featured: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$24',
    period: '/mo',
    features: [
      'Unlimited simulations',
      'AI Advisor deep dives',
      'PDF report exports',
      'Priority support',
    ],
    cta: 'Go Premium',
    featured: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$72',
    period: '/mo',
    features: ['Everything in Premium', 'Shared workspaces', 'Admin analytics'],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function PricingTiers() {
  const navigate = useNavigate();

  return (
    <section className="pricing-tiers" id="pricing">
      <h2 className="pricing-tiers__heading">Pick Your Path Forward</h2>

      <div className="pricing-tiers__grid">
        {TIERS.map((tier) => (
          <div key={tier.id} className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}>
            {tier.featured && <span className="pricing-card__badge">MOST POPULAR</span>}
            <p className="pricing-card__name">{tier.name}</p>
            <p className="pricing-card__price">
              {tier.price}
              <span className="pricing-card__period">{tier.period}</span>
            </p>
            <ul className="pricing-card__features">
              {tier.features.map((f) => (
                <li key={f}>
                  <Check size={14} strokeWidth={2.5} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="pricing-card__cta"
              onClick={() => navigate(`/register?plan=${tier.id}`)}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
