import './DemoPanel.css';

export default function DemoPanel() {
  return (
    <section className="demo-panel" id="simulations">
      <div className="demo-panel__copy">
        <h2 className="demo-panel__title">See Your Decision Engine in Action</h2>
        <p className="demo-panel__description">
          Every simulation runs through our AI advisor and decision engine to surface the paths
          you'd never think to compare.
        </p>
      </div>
      <div className="demo-panel__visual" aria-hidden="true">
        <div className="demo-panel__cards">
          <div className="demo-panel__card demo-panel__card--1">
            <div className="demo-panel__card-icon">
              <div className="demo-panel__pulse" />
            </div>
            <h3 className="demo-panel__card-title">Real-Time Analysis</h3>
            <p className="demo-panel__card-desc">AI processes thousands of scenarios instantly</p>
          </div>
          <div className="demo-panel__card demo-panel__card--2">
            <div className="demo-panel__card-icon">
              <div className="demo-panel__pulse demo-panel__pulse--delay" />
            </div>
            <h3 className="demo-panel__card-title">Risk Quantification</h3>
            <p className="demo-panel__card-desc">Confidence scores for every decision path</p>
          </div>
          <div className="demo-panel__card demo-panel__card--3">
            <div className="demo-panel__card-icon">
              <div className="demo-panel__pulse demo-panel__pulse--delay-2" />
            </div>
            <h3 className="demo-panel__card-title">Path Comparison</h3>
            <p className="demo-panel__card-desc">Compare alternatives side by side</p>
          </div>
        </div>
      </div>
    </section>
  );
}
