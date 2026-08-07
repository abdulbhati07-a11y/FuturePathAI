import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { ArrowUp, ArrowDown, Activity, Sparkles, ArrowRight } from 'lucide-react';
import './SpotlightHero.css';

/* Read a CSS variable at runtime so the chart respects the active theme. */
function cssVar(name, fallback) {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function TrendPill({ trend, value }) {
  const up = trend === 'up';
  const down = trend === 'down';
  const Icon = up ? ArrowUp : down ? ArrowDown : Activity;
  const cls = up ? 'spotlight__trend--up' : down ? 'spotlight__trend--down' : 'spotlight__trend--flat';
  return (
    <span className={`spotlight__trend ${cls}`}>
      <Icon size={12} strokeWidth={2.5} />
      {value != null && <span>{up ? '+' : ''}{value}%</span>}
    </span>
  );
}

function HeroTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="spotlight__tooltip">{Number(payload[0].value).toFixed(1)}</div>;
}

/**
 * SpotlightHero — the editorial "headline metric" band.
 *
 * Features Path Alpha (the Decision Engine output) as the focal figure with a
 * large area chart drawn from the projected-capital / stability trajectory,
 * plus three inline supporting KPIs and the advisor's latest takeaway.
 *
 * Reuses the existing dashboard `stats` + `advisor` data — no new API calls.
 */
export default function SpotlightHero({ stats, advisor, onDeepDive }) {
  const pathAlpha = stats?.pathAlpha ?? {};
  const capital   = stats?.projectedCapital ?? {};
  const stability = stats?.stabilityIndex ?? {};

  const primary = cssVar('--color-primary', '#6366F1');

  const series = useMemo(() => {
    const src =
      capital.history?.length >= 2 ? capital.history
      : stability.history?.length >= 2 ? stability.history
      : [38, 46, 43, 55, 52, 64, 61, 74, 80, 78, 90, 96];
    return src.map((v, i) => ({ i, v: Number(v) }));
  }, [capital.history, stability.history]);

  // Latest advisor line, trimmed to a single punchy takeaway
  const takeaway = advisor?.message
    ? advisor.message.split('. ')[0].replace(/\.$/, '') + '.'
    : 'Your responses are shaping the probability model in real time.';

  return (
    <section className="spotlight" aria-label="Path Alpha overview">
      {/* Ambient background chart */}
      <div className="spotlight__chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spotlight-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={primary} stopOpacity={0.45} />
                <stop offset="60%" stopColor={primary} stopOpacity={0.10} />
                <stop offset="100%" stopColor={primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={['dataMin - 10', 'dataMax + 8']} />
            <Tooltip content={<HeroTooltip />} cursor={{ stroke: primary, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={primary}
              strokeWidth={2.5}
              fill="url(#spotlight-grad)"
              dot={false}
              activeDot={{ r: 4, fill: primary, stroke: 'var(--bg-surface)', strokeWidth: 2 }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ambient glows */}
      <div className="spotlight__glow spotlight__glow--a" aria-hidden="true" />
      <div className="spotlight__glow spotlight__glow--b" aria-hidden="true" />

      {/* Foreground content */}
      <div className="spotlight__content">
        <div className="spotlight__badge">
          <Sparkles size={12} strokeWidth={2} />
          <span>Decision Engine Output</span>
          <span className="spotlight__live-dot" />
        </div>

        <div className="spotlight__headline">
          <div className="spotlight__metric-block">
            <span className="spotlight__grade">{pathAlpha.label ?? 'A/B'}</span>
            <div className="spotlight__figure">
              <span className="spotlight__value">
                {pathAlpha.trend === 'down' ? '' : '+'}{pathAlpha.value ?? 0}%
              </span>
              <TrendPill trend={pathAlpha.trend} />
            </div>
            <span className="spotlight__caption">Path Alpha — projected edge over baseline</span>
          </div>

          <div className="spotlight__aside">
            <p className="spotlight__takeaway">
              <span className="spotlight__takeaway-icon"><Sparkles size={13} strokeWidth={2} /></span>
              {takeaway}
            </p>
            <button type="button" className="spotlight__cta" onClick={onDeepDive}>
              Deep Dive with AI
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
