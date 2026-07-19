import './TrustStrip.css';

const LOGOS = ['Vantage Capital', 'Horizon Partners', 'Nordwind Group', 'Atlas Ventures'];

export default function TrustStrip() {
  return (
    <section className="trust-strip">
      <p className="trust-strip__heading">Trusted to model decisions at</p>
      <div className="trust-strip__logos">
        {LOGOS.map((name) => (
          <span key={name} className="trust-strip__logo">
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
