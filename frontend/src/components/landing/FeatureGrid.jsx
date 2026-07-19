import { TrendingUp, ShieldCheck, GitBranch } from 'lucide-react';
import './FeatureGrid.css';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Model Your Life Trajectory',
    description: 'Run thousands of scenario branches across career, finance, and life decisions.',
  },
  {
    icon: ShieldCheck,
    title: 'Quantified Risk & Confidence',
    description: 'Every path comes with a transparent risk score and AI confidence rating.',
  },
  {
    icon: GitBranch,
    title: 'Compare Real Alternatives',
    description: 'See exactly how your chosen path stacks up against the roads not taken.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="feature-grid" id="features">
      {FEATURES.map(({ icon: Icon, title, description }) => (
        <div key={title} className="feature-grid__card">
          <span className="feature-grid__icon">
            <Icon size={18} strokeWidth={2} />
          </span>
          <h3 className="feature-grid__title">{title}</h3>
          <p className="feature-grid__description">{description}</p>
        </div>
      ))}
    </section>
  );
}
