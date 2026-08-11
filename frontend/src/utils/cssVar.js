/**
 * Read a CSS custom property from :root at runtime.
 *
 * Recharts SVG props (stroke / fill) need a real colour string — a `var(--x)`
 * reference won't paint — so charts read their palette through this helper and
 * therefore follow the active theme like the rest of the UI. Falls back to the
 * sand-brand primary during SSR or when the variable is unset.
 */
export function cssVar(name, fallback = '#d4d6b9') {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
