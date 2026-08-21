/**
 * FuturePath AI — brand mark.
 *
 * An "ascending fork": a single stem rises from an origin node (the present
 * decision) and splits into two diverging paths that climb to the right (the
 * simulated futures). One path ascends steeply, the other levels off — the
 * essence of the product: one choice, multiple scored trajectories.
 *
 * The mark is drawn entirely in `currentColor`, so it inherits whatever the
 * surrounding brand container sets:
 *   - dark ink on the primary-filled boxes (sidebar, public nav, auth cards)
 *   - the primary tint when placed bare on a dark surface (mobile navbar)
 * This means it adapts to both the dark ("sand dune") and light ("burnt
 * orange") themes with no per-theme overrides.
 *
 * Geometry lives in a 24×24 viewBox to match the lucide icons it sits beside,
 * so `size` maps 1:1 to the space the old icon occupied.
 */
export default function Logo({
  size = 24,
  strokeWidth = 2,
  className,
  title = 'FuturePath AI',
  ...rest
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={title}
      {...rest}
    >
      <title>{title}</title>

      {/* stem — the present, rising toward the decision point */}
      <path d="M4 19.5 C 6 17 8 15.5 10.5 14" />

      {/* branch A — the ascendant future (steep climb) */}
      <path d="M10.5 14 C 13.5 11 16.5 8 20 5" />

      {/* branch B — the alternate future (levels off) */}
      <path d="M10.5 14 C 13.5 13.5 16.5 12.5 20 12" />

      {/* nodes: one origin, two outcomes */}
      <circle cx="4"  cy="19.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="20" cy="5"    r="2"   fill="currentColor" stroke="none" />
      <circle cx="20" cy="12"   r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
