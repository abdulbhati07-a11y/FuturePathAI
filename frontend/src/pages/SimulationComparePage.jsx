import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import './SimulationComparePage.css';

const SCORE_KEYS = [
  { key: 'feasibilityScore', label: 'Feasibility' },
  { key: 'riskScore',        label: 'Risk' },
  { key: 'impactScore',      label: 'Impact' },
  { key: 'timelineScore',    label: 'Timeline' },
  { key: 'confidenceScore',  label: 'Confidence' },
];

function pickScore(report, key) {
  return report?.scores?.[key] ?? report?.[key] ?? report?.analysis?.[key] ?? 0;
}

function pct(val) { return Math.round(val * 100); }

function MetricRow({ label, a, b }) {
  const aVal = pct(a);
  const bVal = pct(b);
  const winner = aVal > bVal ? 'a' : bVal > aVal ? 'b' : null;
  return (
    <div className="compare__metric-row">
      <span className={`compare__metric-val${winner === 'a' ? ' compare__metric-val--win' : ''}`}>
        {aVal}%
      </span>
      <span className="compare__metric-label">{label}</span>
      <span className={`compare__metric-val${winner === 'b' ? ' compare__metric-val--win' : ''}`}>
        {bVal}%
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
        const { data, error } = await supabase.from('simulations').select('*').limit(50);
        const list = data || [];
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
          supabase.from('simulations').select('*').eq('id', idA).single().then(r => r.data),
          supabase.from('simulations').select('*').eq('id', idB).single().then(r => r.data),
          supabase.from('reports').select('*').eq('simulation_id', idA).single().then(r => {
            const data = r.data;
            if (!data) return null;
            return { scores: data.scores, analysis: data.recommendations };
          }).catch(() => null),
          supabase.from('reports').select('*').eq('simulation_id', idB).single().then(r => {
            const data = r.data;
            if (!data) return null;
            return { scores: data.scores, analysis: data.recommendations };
          }).catch(() => null),
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

  const radarData = SCORE_KEYS.map(({ key, label }) => ({
    metric: label,
    A: pct(pickScore(reportA, key)),
    B: pct(pickScore(reportB, key)),
  }));

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
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar name={simA?.title || 'A'} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              <Radar name={simB?.title || 'B'} dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="compare__card">
          <h3 className="compare__card-title">Head-to-Head</h3>
          <div className="compare__metric-header">
            <span>{simA?.title || 'A'}</span>
            <span>Metric</span>
            <span>{simB?.title || 'B'}</span>
          </div>
          {SCORE_KEYS.map(({ key, label }) => (
            <MetricRow
              key={key} label={label}
              a={pickScore(reportA, key)}
              b={pickScore(reportB, key)}
            />
          ))}
        </div>

        <div className="compare__card compare__card--wide">
          <h3 className="compare__card-title">Score Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={radarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar dataKey="A" name={simA?.title || 'Sim A'} fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="B" name={simB?.title || 'Sim B'} fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
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
