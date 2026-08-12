import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { toText, toNumber } from './reportContent';
import './ScenarioComparison.css';

function ScenarioCard({ scenario, isFeatured }) {
  if (!scenario) return null;
  // Fields come from the AI; coerce each to a primitive so a stray nested
  // object can't crash the render.
  const label = toText(scenario.label);
  const probability = toNumber(scenario.probability);
  const title = toText(scenario.title, ['title', 'headline', 'summary']);
  const description = toText(scenario.description, ['description', 'detail', 'text']);
  const salaryDelta = toText(scenario.salaryDelta, ['salaryDelta', 'salary', 'value']);
  const satisfaction = toText(scenario.satisfaction, ['satisfaction', 'score', 'value']);

  return (
    <div className={`scenario-card ${isFeatured ? 'scenario-card--featured' : ''}`}>
      {isFeatured && <span className="scenario-card__badge">MOST PROB.</span>}
      <div className="scenario-card__head">
        <span className="scenario-card__label">{label}</span>
        <span className="scenario-card__probability">{probability}% PROB.</span>
      </div>
      <h3 className="scenario-card__title">{title}</h3>
      <p className="scenario-card__description">{description}</p>
      <div className="scenario-card__metrics">
        <div>
          <p className="scenario-card__metric-label">Salary Potential</p>
          <p className="scenario-card__metric-value">{salaryDelta}</p>
        </div>
        <div>
          <p className="scenario-card__metric-label">Satisfaction</p>
          <p className="scenario-card__metric-value">{satisfaction}</p>
        </div>
      </div>
    </div>
  );
}

function parseSalary(str) {
  if (!str || typeof str !== 'string') return 0;
  const multiplier = str.toLowerCase().includes('k') ? 1000 : 1;
  const num = parseInt(str.replace(/[^0-9-]/g, ''), 10);
  return isNaN(num) ? 0 : Math.abs(num * multiplier);
}

const BAR_COLORS = ['var(--color-danger)', 'var(--color-primary)', 'var(--color-success)'];

export default function ScenarioComparison({ bestCase, mostLikely, worstCase }) {
  const chartData = [
    { name: 'Worst',  salary: parseSalary(worstCase?.salaryDelta),   fill: BAR_COLORS[0] },
    { name: 'Likely', salary: parseSalary(mostLikely?.salaryDelta),  fill: BAR_COLORS[1] },
    { name: 'Best',   salary: parseSalary(bestCase?.salaryDelta),    fill: BAR_COLORS[2] },
  ];

  const maxVal = Math.max(...chartData.map(d => d.salary), 1);

  return (
    <div className="scenario-comparison-wrap">
      {/* ── Scenario cards ──────────────────────────────────────────────── */}
      <div className="scenario-comparison">
        <ScenarioCard scenario={bestCase} />
        <ScenarioCard scenario={mostLikely} isFeatured />
        <ScenarioCard scenario={worstCase} />
      </div>

      {/* ── Financial projection chart ───────────────────────────────────── */}
      {/* Uses a fixed pixel width (not ResponsiveContainer) so html2canvas  */}
      {/* captures it correctly during PDF export.                           */}
      <div className="scenario-chart">
        <h3 className="scenario-chart__heading">Financial Projections (USD)</h3>

        {/* Accessible bar chart built with CSS — renders perfectly in PDF */}
        <div className="scenario-chart__bars" aria-label="Scenario salary projections">
          {chartData.map(({ name, salary, fill }) => {
            const pct = maxVal > 0 ? Math.round((salary / maxVal) * 100) : 0;
            return (
              <div key={name} className="scenario-chart__bar-group">
                <div className="scenario-chart__bar-label">{name}</div>
                <div className="scenario-chart__bar-track" aria-label={`${name}: $${salary.toLocaleString()}`}>
                  <div
                    className="scenario-chart__bar-fill"
                    style={{ width: `${pct}%`, background: fill }}
                  />
                </div>
                <div className="scenario-chart__bar-value">
                  ${salary >= 1000
                    ? `${Math.round(salary / 1000)}k`
                    : salary.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="scenario-chart__legend">
          {[
            { label: 'Worst Case',  color: BAR_COLORS[0] },
            { label: 'Most Likely', color: BAR_COLORS[1] },
            { label: 'Best Case',   color: BAR_COLORS[2] },
          ].map(({ label, color }) => (
            <div key={label} className="scenario-chart__legend-item">
              <span className="scenario-chart__legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
