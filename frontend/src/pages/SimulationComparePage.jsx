import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { cssVar } from '../utils/cssVar';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import './SimulationComparePage.css';

// Scores are stored on a 0-100 scale already. Returns null when the value is
// genuinely absent, so a missing score renders as "—" instead of a real-looking 0.
// `Number(null)` is 0, hence the explicit absence check before coercing.
function score(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : null;
}

// Only metrics this system actually produces. The three that used to sit here —
// Feasibility, Impact, Timeline — exist nowhere in the schema, the API or the
// report, so every comparison showed them as a 0% tie.
const METRICS = [
  { key: 'decision',   label: 'Decision',   get: (sim, rep) => score(rep?.scores?.decisionScore   ?? sim?.decisionScore) },
  { key: 'confidence', label: 'Confidence', get: (sim, rep) => score(rep?.scores?.confidenceScore ?? sim?.confidenceScore) },
  { key: 'risk',       label: 'Risk',       lowerIsBetter: true, get: (sim, rep) => score(rep?.scores?.riskScore ?? sim?.riskScore) },
  { key: 'upside',     label: 'Upside',     get: (_sim, rep) => score(rep?.recommendations?.bestCase?.probability) },
  { key: 'downside',   label: 'Downside',   lowerIsBetter: true, get: (_sim, rep) => score(rep?.recommendations?.worstCase?.probability) },
];

function MetricRow({ label, a, b, lowerIsBetter }) {
  // For risk and downside exposure the smaller number is the better outcome.
  const winner = a === null || b === null || a === b
    ? null
    : (lowerIsBetter ? (a < b ? 'a' : 'b') : (a > b ? 'a' : 'b'));
  return (
    <div className="compare__metric-row">
      <span className={`compare__metric-val${winner === 'a' ? ' compare__metric-val--win' : ''}`}>
        {a === null ? '—' : `${a}%`}
      </span>
      <span className="compare__metric-label">{label}</span>
      <span className={`compare__metric-val${winner === 'b' ? ' compare__metric-val--win' : ''}`}>
        {b === null ? '—' : `${b}%`}
      </span>
    </div>
  );
}

export default function SimulationComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const idA = searchParams.get('a');
  const idB = searchParams.get('b');

  const [data, setData] = useState({ simA: null, simB: null, reportA: null, reportB: null });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  // Picker state — used when we have `a` but no `b` yet.
  const [pickList, setPickList] = useState([]);
  const [pickLoading, setPickLoading] = useState(false);

  // ── Load the candidate list for the "pick B" step ──────────────────────────
  useEffect(() => {
    if (!idA || idB) return; // only when exactly one id is present
    let mounted = true;
    setPickLoading(true);
    (async () => {
      try {
        const raw = await apiClient.get('/simulations?limit=50');
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setPickList(list.filter(s => String(s.id) !== String(idA)));
      } catch {
        if (mounted) setPickList([]);
      } finally {
        if (mounted) setPickLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [idA, idB]);

  useEffect(() => {
    if (!idA || !idB) { setStatus(idA || idB ? 'pick' : 'no-ids'); return; }

    async function load() {
      setStatus('loading');
      try {
        const [simA, simB, reportA, reportB] = await Promise.all([
          apiClient.get(`/simulations/${idA}`),
          apiClient.get(`/simulations/${idB}`),
          apiClient.get(`/reports/simulations/${idA}`).catch(() => null),
          apiClient.get(`/reports/simulations/${idB}`).catch(() => null),
        ]);
        setData({ simA, simB, reportA, reportB });
        setStatus('ready');
      } catch (err) {
        setError(err.message || 'Failed to load simulations.');
        setStatus('error');
      }
    }

    load();
  }, [idA, idB]);

  // ── Pick the second path to compare against ────────────────────────────────
  if (status === 'pick') {
    const anchor = idA || idB;
    return (
      <div className="compare__picker">
        <div className="compare__topbar">
          <button className="compare__back" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="compare__title">Compare with another path</h1>
        </div>
        <p className="compare__picker-hint">
          Choose a second simulation to compare against this one.
        </p>
        {pickLoading ? (
          <div className="compare__loading">Loading your simulations…</div>
        ) : pickList.length === 0 ? (
          <div className="compare__empty">
            <p>You need at least two simulations to compare. Run another one first.</p>
            <button onClick={() => navigate('/app/simulations/new')}>Run a Simulation</button>
          </div>
        ) : (
          <ul className="compare__picker-list">
            {pickList.map(sim => (
              <li key={sim.id}>
                <button
                  className="compare__picker-item"
                  onClick={() => setSearchParams({ a: anchor, b: String(sim.id) })}
                >
                  <span className="compare__picker-name">{sim.title || `Simulation ${sim.id}`}</span>
                  {sim.category && <span className="compare__picker-cat">{sim.category}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (status === 'no-ids') {
    return (
      <div className="compare__empty">
        <p>Add <code>?a=simId1&amp;b=simId2</code> to the URL to compare two simulations.</p>
        <button onClick={() => navigate('/app/history')}>Go to History</button>
      </div>
    );
  }
  if (status === 'loading') return <div className="compare__loading">Loading…</div>;
  if (status === 'error') {
    return (
      <div className="compare__empty">
        <p>⚠️ {error}</p>
        <button onClick={() => navigate('/app/history')}>Go to History</button>
      </div>
    );
  }

  const { simA, simB, reportA, reportB } = data;

  const metrics = METRICS.map(m => ({
    ...m,
    a: m.get(simA, reportA),
    b: m.get(simB, reportB),
  }));

  // A radar vertex and a bar can only be drawn from a number, and Recharts plots
  // a nullish value at zero (Radar.js: `isNullish(pointValue) ? 0 : …`) — so a
  // metric only one side reported would draw the other side as a scored 0, which
  // is the same fabrication as showing "0%" in the table. The charts therefore
  // plot only the metrics both sides have; the Head-to-Head table below still
  // lists every metric, one-sided ones included, so nothing is quietly dropped.
  const comparable = metrics.filter(m => m.a !== null && m.b !== null);
  const chartData = comparable.map(m => ({ metric: m.label, A: m.a, B: m.b }));
  const oneSided = metrics.filter(m => (m.a === null) !== (m.b === null));

  const chartNote = oneSided.length > 0 ? (
    <p className="compare__chart-note">
      Charted: only metrics both paths reported.{' '}
      {oneSided.map(m => m.label).join(', ')} {oneSided.length === 1 ? 'is' : 'are'} reported
      for one path only — see Head-to-Head.
    </p>
  ) : null;

  const emptyChart = (
    <div className="compare__chart-empty">
      <p>No metric is reported for both paths yet.</p>
      <p className="compare__chart-empty-sub">
        Generate the report for each simulation to compare them side by side.
      </p>
    </div>
  );

  // Recharts SVG props need real colours at runtime. Series A uses the brand
  // primary, series B the success token — distinguishable in every theme.
  const colorA = cssVar('--color-primary');
  const colorB = cssVar('--color-success', '#34D399');
  const axisColor = cssVar('--text-tertiary');
  const gridColor = cssVar('--border-subtle');
  const tooltipBg = cssVar('--bg-surface-elevated');
  const tooltipBorder = cssVar('--border-strong');
  const tooltipLabel = cssVar('--text-primary');

  return (
    <div className="compare">
      <div className="compare__topbar">
        <button className="compare__back" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="compare__title">Simulation Comparison</h1>
      </div>

      <div className="compare__sim-row">
        <div className="compare__sim-card compare__sim-card--a">
          <span className="compare__badge">A</span>
          <span className="compare__sim-name">{simA?.title || idA}</span>
          <span className="compare__sim-cat">{simA?.category}</span>
        </div>
        <span className="compare__vs">vs</span>
        <div className="compare__sim-card compare__sim-card--b">
          <span className="compare__badge compare__badge--b">B</span>
          <span className="compare__sim-name">{simB?.title || idB}</span>
          <span className="compare__sim-cat">{simB?.category}</span>
        </div>
      </div>

      <div className="compare__grid">
        <div className="compare__card">
          <h3 className="compare__card-title">Score Radar</h3>
          {chartData.length === 0 ? emptyChart : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={chartData}>
                  <PolarGrid stroke={gridColor} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: axisColor, fontSize: 11 }} />
                  <Radar name={simA?.title || 'A'} dataKey="A" stroke={colorA} fill={colorA} fillOpacity={0.25} />
                  <Radar name={simB?.title || 'B'} dataKey="B" stroke={colorB} fill={colorB} fillOpacity={0.2} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              {chartNote}
            </>
          )}
        </div>

        <div className="compare__card">
          <h3 className="compare__card-title">Head-to-Head</h3>
          <div className="compare__metric-header">
            <span>{simA?.title || 'A'}</span>
            <span>Metric</span>
            <span>{simB?.title || 'B'}</span>
          </div>
          {metrics.map(({ key, label, a, b, lowerIsBetter }) => (
            <MetricRow
              key={key} label={label}
              a={a} b={b} lowerIsBetter={lowerIsBetter}
            />
          ))}
        </div>

        <div className="compare__card compare__card--wide">
          <h3 className="compare__card-title">Score Overview</h3>
          {chartData.length === 0 ? emptyChart : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="metric" tick={{ fill: axisColor, fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: axisColor, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                    labelStyle={{ color: tooltipLabel }}
                  />
                  <Legend />
                  <Bar dataKey="A" name={simA?.title || 'Sim A'} fill={colorA} radius={[4,4,0,0]} />
                  <Bar dataKey="B" name={simB?.title || 'Sim B'} fill={colorB} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              {chartNote}
            </>
          )}
        </div>
      </div>

      <div className="compare__links">
        <button className="compare__link-btn" onClick={() => navigate(`/simulations/${idA}/results`)}>
          View Full Report A →
        </button>
        <button className="compare__link-btn" onClick={() => navigate(`/simulations/${idB}/results`)}>
          View Full Report B →
        </button>
      </div>
    </div>
  );
}
