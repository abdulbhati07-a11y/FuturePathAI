import { useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cssVar } from '../utils/cssVar';
import './SpotlightHero.css';

function HeroTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return <div className="spotlight__tooltip">{Number(payload[0].value)}%</div>;
}

/**
 * SpotlightHero — the editorial "headline metric" band.
 *
 * Features the user's strongest analysed path: the highest decision score across
 * the reports they have generated, with its letter grade, the simulation it came
 * from, and the decision scores of their other paths drawn behind it.
 *
 * What it used to feature was "Path Alpha — projected edge over baseline",
 * +26%, under a "Decision Engine Output" badge with a pulsing live dot. There
 * was no path alpha, no baseline and no edge: the figure was
 * `Math.floor(20 + Math.random() * 30)`, redrawn every two seconds, and the
 * chart behind it was a hardcoded curve that ran [38, 46, 43, 55, …] whenever no
 * history was supplied — which was always, because none existed. The takeaway
 * line beneath it came from a list of five canned sentences chosen at random.
 *
 * Every figure here is now the user's own, and the band only renders when there
 * is a scored path to feature (see DashboardPage).
 */
export default function SpotlightHero({ stats, advisor, onDeepDive }) {
  const strongest = stats?.strongest;
  const decision = stats?.decision;

  const primary = cssVar('--color-primary');

  // The real series or none at all. A single scored path gets a dot rather than
  // a trajectory, because one reading is not a trend.
  const series = useMemo(
    () => (Array.isArray(decision?.history) ? decision.history : [])
      .filter(v => Number.isFinite(Number(v)))
      .map((v, i) => ({ i, v: Number(v) })),
    [decision?.history],
  );

  if (!strongest) return null;

  // The advisor summary's opening sentence — itself derived from these same rows.
  const takeaway = advisor?.message ? advisor.message.split('. ')[0].replace(/\.$/, '') + '.' : null;

  const sample = strongest.total > strongest.scored
    ? `${strongest.scored} analysed ${strongest.scored === 1 ? 'path' : 'paths'} of ${strongest.total} simulations`
    : `${strongest.scored} analysed ${strongest.scored === 1 ? 'path' : 'paths'}`;

  return (
    <section className="spotlight" aria-label="Your strongest analysed path">
      {/* Ambient background chart — the decision score of each analysed path */}
      {series.length > 0 && (
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
                dot={series.length === 1 ? { r: 4, fill: primary } : false}
                activeDot={{ r: 4, fill: primary, stroke: 'var(--bg-surface)', strokeWidth: 2 }}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ambient glows */}
      <div className="spotlight__glow spotlight__glow--a" aria-hidden="true" />
      <div className="spotlight__glow spotlight__glow--b" aria-hidden="true" />

      {/* Foreground content */}
      <div className="spotlight__content">
        <div className="spotlight__badge">
          <Sparkles size={12} strokeWidth={2} />
          <span>Strongest path so far</span>
        </div>

        <div className="spotlight__headline">
          <div className="spotlight__metric-block">
            {strongest.grade && <span className="spotlight__grade">{strongest.grade}</span>}
            <div className="spotlight__figure">
              <span className="spotlight__value">{strongest.value}%</span>
            </div>
            <span className="spotlight__caption">
              Decision score — {strongest.title}
            </span>
            <span className="spotlight__sample">{sample}</span>
          </div>

          <div className="spotlight__aside">
            {takeaway && (
              <p className="spotlight__takeaway">
                <span className="spotlight__takeaway-icon"><Sparkles size={13} strokeWidth={2} /></span>
                {takeaway}
              </p>
            )}
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
