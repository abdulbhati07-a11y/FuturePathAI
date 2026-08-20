import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  RadialBarChart, RadialBar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cssVar } from '../utils/cssVar';
import './StatsGrid.css';

/* ── Tiny Recharts tooltips ───────────────────────────────────────────────── */
function MicroTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;
  const val = formatter ? formatter(payload[0].value) : payload[0].value;
  return (
    <div className="stat-chart__tooltip">
      {val}
    </div>
  );
}

/* Each sparkline used to fall back to a hardcoded curve — [40, 55, 45, 65, 58,
   75, 70, 85] — whenever it was handed fewer than two points, so a card with no
   history still drew a confident rising line. There is no substitute for the
   data, so an empty series now draws nothing and the card says how many readings
   it has. */
function toPoints(data) {
  return (Array.isArray(data) ? data : [])
    .filter(v => Number.isFinite(Number(v)))
    .map((v, i) => ({ i, v: Number(v) }));
}

/* ── 1. Area sparkline (average decision score over time) ─────────────────── */
function AreaSparkline({ data, color }) {
  const points = toPoints(data);
  if (points.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`area-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Tooltip
          content={<MicroTooltip formatter={v => `${v}%`} />}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#area-grad-${color})`}
          dot={points.length === 1 ? { r: 3, fill: color } : false}
          animationDuration={900}
          animationEasing="ease-out"
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 2. Bar sparkline (confidence per analysed path) ──────────────────────── */
function BarSparkline({ data, color }) {
  const points = toPoints(data).slice(-6);
  if (points.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={44}>
      <BarChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
        <Tooltip
          content={<MicroTooltip formatter={v => `${v}%`} />}
          cursor={{ fill: cssVar('--border-subtle') }}
        />
        <Bar
          dataKey="v"
          fill={color}
          radius={[2, 2, 0, 0]}
          maxBarSize={10}
          animationDuration={800}
          animationEasing="ease-out"
          isAnimationActive
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 3. Radial bar (strongest path's decision score) ──────────────────────── */
function RadialSparkline({ percent, color }) {
  const data = [{ v: Math.min(Math.max(percent, 0), 100), fill: color }];
  return (
    <ResponsiveContainer width="100%" height={44}>
      <RadialBarChart
        cx="50%" cy="100%"
        innerRadius="60%" outerRadius="100%"
        startAngle={180} endAngle={0}
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        {/* Track */}
        <RadialBar
          dataKey="v"
          background={{ fill: 'rgba(128,128,128,0.12)' }}
          cornerRadius={4}
          animationDuration={1000}
          animationEasing="ease-out"
          isAnimationActive
        />
        <Tooltip content={<MicroTooltip formatter={v => `${v}%`} />} />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

/* ── 4. Risk gauge — horizontal bar with coloured fill ───────────────────── */
function RiskGauge({ value, label }) {
  const pct  = Math.min(Math.max(value, 0), 100);
  const col  = pct < 30 ? 'var(--color-success)'
             : pct < 70 ? 'var(--color-warning)'
             : 'var(--color-danger)';
  return (
    <div className="stat-card__risk-gauge">
      <div className="stat-card__risk-gauge-track">
        <div
          className="stat-card__risk-gauge-fill"
          style={{ width: `${pct}%`, background: col }}
        />
      </div>
      {label && <span className="stat-card__risk-label" style={{ color: col }}>{label}</span>}
    </div>
  );
}

/* ── Trend icon ───────────────────────────────────────────────────────────────
   The arrow says which way the number moved; the colour says whether that is
   good news. They used to be one field, so a rising risk score — the arrow the
   user most needs to notice — was painted the same green as rising confidence. */
function TrendIcon({ trend, sentiment = 'neutral' }) {
  const Icon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Activity;
  const tone = sentiment === 'good' ? 'good' : sentiment === 'bad' ? 'bad' : 'neutral';
  const words = trend === 'stable'
    ? 'holding steady across your analysed paths'
    : `trending ${trend} across your analysed paths`;
  return (
    <Icon
      size={12}
      className={`stat-card__trend stat-card__trend--${tone}`}
      aria-label={words}
    />
  );
}

/* How many readings the average was taken over — printed on every card, because
   an average over two paths and an average over twenty are different claims.
   These lines used to read "Market Volatility Analysis", "Risk Assessment
   Model", "Portfolio Projection" and "Decision Engine Output": they named an
   authority for figures that came from Math.random(). */
function sampleNote({ scored, total }) {
  if (!Number.isFinite(scored) || scored <= 0) return 'Not analysed yet';
  const paths = `${scored} analysed ${scored === 1 ? 'path' : 'paths'}`;
  return Number.isFinite(total) && total > scored
    ? `${paths} of ${total} simulations`
    : paths;
}

/* ════════════════════════════════════════════════════════════════════════════
   Main StatsGrid
   ════════════════════════════════════════════════════════════════════════════ */
export default function StatsGrid({ stats, exclude = [] }) {
  if (!stats) return null;

  // Each metric is null until the user has at least one scored report, and a
  // null card is dropped from the render below rather than shown as a zero.
  const { confidence, risk, decision, strongest } = stats;

  // Resolve theme colours at render time so charts match the active theme
  const primary = cssVar('--color-primary');
  const success = cssVar('--color-success', '#34D399');

  // Data-driven card list so consumers can hide specific metrics via `exclude`.
  // The dashboard hides `strongest` because the SpotlightHero owns that figure.
  const cards = [
    {
      key: 'confidence',
      render: () => (
        <div className="stat-card" key="confidence">
          <div className="stat-card__head">
            <span className="stat-card__label">Avg. confidence</span>
            <TrendIcon trend={confidence.trend} sentiment={confidence.sentiment} />
          </div>
          <BarSparkline data={confidence.history} color={primary} />
          <p className="stat-card__value">{confidence.value}%</p>
          <span className="stat-card__source">{sampleNote(confidence)}</span>
        </div>
      ),
    },
    {
      key: 'risk',
      render: () => (
        <div className="stat-card" key="risk">
          <div className="stat-card__head">
            <span className="stat-card__label">Avg. risk</span>
            <TrendIcon trend={risk.trend} sentiment={risk.sentiment} />
          </div>
          <RiskGauge value={risk.value} label={risk.label} />
          <p className="stat-card__value">{risk.value} <span className="stat-card__unit">/ 100</span></p>
          <span className="stat-card__source">{sampleNote(risk)}</span>
        </div>
      ),
    },
    {
      key: 'decision',
      render: () => (
        <div className="stat-card" key="decision">
          <div className="stat-card__head">
            <span className="stat-card__label">Avg. decision score</span>
            <TrendIcon trend={decision.trend} sentiment={decision.sentiment} />
          </div>
          <AreaSparkline data={decision.history} color={success} />
          <p className="stat-card__value">{decision.value}%</p>
          <span className="stat-card__source">{sampleNote(decision)}</span>
        </div>
      ),
    },
    {
      key: 'strongest',
      render: () => (
        <div className="stat-card" key="strongest">
          <div className="stat-card__head">
            <span className="stat-card__label">Strongest path</span>
          </div>
          <RadialSparkline percent={strongest.value} color={primary} />
          <p className="stat-card__value">
            {strongest.grade ?? '—'}{' '}
            <span className="stat-card__value-sub">{strongest.value}%</span>
          </p>
          <span className="stat-card__source">{strongest.title}</span>
        </div>
      ),
    },
  ];

  const visible = cards.filter(c => !exclude.includes(c.key) && stats[c.key]);
  // Nothing scored yet means every metric is null, and an empty grid would still
  // occupy its bottom margin. The page shows its own notice in that case.
  if (visible.length === 0) return null;

  return (
    <div className="stats-grid" data-count={visible.length}>
      {visible.map(c => c.render())}
    </div>
  );
}
