import { ArrowUp, ArrowDown, Activity } from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar,
  RadialBarChart, RadialBar,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
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

/* ── 1. Area sparkline (Projected Capital) ────────────────────────────────── */
function AreaSparkline({ data, color }) {
  const points = (data?.length >= 2 ? data : [40, 55, 45, 65, 58, 75, 70, 85])
    .map((v, i) => ({ i, v }));

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
          content={<MicroTooltip formatter={v => v?.toFixed(1)} />}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#area-grad-${color})`}
          dot={false}
          animationDuration={900}
          animationEasing="ease-out"
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 2. Bar sparkline (Stability Index) ───────────────────────────────────── */
function BarSparkline({ data, color }) {
  const points = (data?.length >= 2 ? data : [40, 65, 45, 80, 55, 90])
    .slice(-6)
    .map((v, i) => ({ i, v }));

  return (
    <ResponsiveContainer width="100%" height={44}>
      <BarChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }} barCategoryGap="20%">
        <Tooltip
          content={<MicroTooltip formatter={v => `${v?.toFixed(1)}%`} />}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
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

/* ── 3. Radial bar (Path Alpha) ───────────────────────────────────────────── */
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
      <span className="stat-card__risk-label" style={{ color: col }}>{label}</span>
    </div>
  );
}

/* ── Trend icon ───────────────────────────────────────────────────────────── */
function TrendIcon({ trend }) {
  if (trend === 'up')   return <ArrowUp   size={12} className="stat-card__trend stat-card__trend--up"   />;
  if (trend === 'down') return <ArrowDown size={12} className="stat-card__trend stat-card__trend--down" />;
  return                       <Activity  size={12} className="stat-card__trend stat-card__trend--stable" />;
}

/* ════════════════════════════════════════════════════════════════════════════
   Main StatsGrid
   ════════════════════════════════════════════════════════════════════════════ */
export default function StatsGrid({ stats, exclude = [] }) {
  if (!stats) return null;

  const { stabilityIndex, riskVector, projectedCapital, pathAlpha } = stats;

  // Resolve theme colours at render time so charts match the active theme
  const primary = cssVar('--color-primary');
  const success = cssVar('--color-success', '#34D399');

  // Data-driven card list so consumers can hide specific metrics via `exclude`.
  // The dashboard hides `pathAlpha` because the SpotlightHero owns that figure.
  const cards = [
    {
      key: 'stabilityIndex',
      render: () => (
        <div className="stat-card stat-card--live" key="stabilityIndex">
          <span className="stat-card__live-dot" aria-hidden="true" />
          <div className="stat-card__head">
            <span className="stat-card__label">STABILITY INDEX</span>
            <TrendIcon trend={stabilityIndex.trend} />
          </div>
          <BarSparkline data={stabilityIndex.history} color={primary} />
          <p className="stat-card__value">{stabilityIndex.value}%</p>
          <span className="stat-card__source">Market Volatility Analysis</span>
        </div>
      ),
    },
    {
      key: 'riskVector',
      render: () => (
        <div className="stat-card stat-card--live" key="riskVector">
          <span className="stat-card__live-dot" aria-hidden="true" />
          <div className="stat-card__head">
            <span className="stat-card__label">RISK VECTOR</span>
            <TrendIcon trend={riskVector.trend} />
          </div>
          <RiskGauge value={riskVector.value} label={riskVector.label} />
          <p className="stat-card__value">{riskVector.value} <span className="stat-card__unit">pts</span></p>
          <span className="stat-card__source">Risk Assessment Model</span>
        </div>
      ),
    },
    {
      key: 'projectedCapital',
      render: () => (
        <div className="stat-card stat-card--live" key="projectedCapital">
          <span className="stat-card__live-dot" aria-hidden="true" />
          <div className="stat-card__head">
            <span className="stat-card__label">PROJ. CAPITAL</span>
            <TrendIcon trend={projectedCapital?.trend} />
          </div>
          <AreaSparkline data={projectedCapital.history} color={success} />
          <p className="stat-card__value">${projectedCapital.value}M</p>
          <span className="stat-card__source">Portfolio Projection</span>
        </div>
      ),
    },
    {
      key: 'pathAlpha',
      render: () => (
        <div className="stat-card stat-card--live" key="pathAlpha">
          <span className="stat-card__live-dot" aria-hidden="true" />
          <div className="stat-card__head">
            <span className="stat-card__label">PATH ALPHA</span>
            <TrendIcon trend={pathAlpha.trend} />
          </div>
          <RadialSparkline percent={pathAlpha.value} color={primary} />
          <p className="stat-card__value">
            {pathAlpha.label}{' '}
            <span className="stat-card__value-sub">+{pathAlpha.value}%</span>
          </p>
          <span className="stat-card__source">Decision Engine Output</span>
        </div>
      ),
    },
  ];

  const visible = cards.filter(c => !exclude.includes(c.key));

  return (
    <div className="stats-grid" data-count={visible.length}>
      {visible.map(c => c.render())}
    </div>
  );
}
