import { useRef, useState, useCallback, useLayoutEffect } from 'react';

/**
 * useStickyScroll — "stick to bottom" scrolling for chat / streaming UIs.
 *
 * Behavior
 *  • Follows new content — both new messages AND the per-token growth of a
 *    streaming reply — but ONLY while the user is near the bottom ("pinned").
 *    The follow is instant (`el.scrollTop = el.scrollHeight`) so a fast token
 *    stream doesn't queue dozens of competing smooth-scroll animations.
 *  • The moment the user scrolls up — even mid-stream — following stops and a
 *    "jump to bottom" affordance is shown. Scrolling back near the bottom
 *    re-pins and following resumes.
 *  • `scrollToBottom()` smoothly returns to the latest content and re-pins.
 *
 * Performance / safety
 *  • "pinned" lives in a ref, so the scroll hot-path never triggers a render.
 *    The only React state is `showJumpButton`, and it is updated only when its
 *    value actually flips — at most one render per crossing of the threshold,
 *    not one per scroll event.
 *  • The scroll handler is rAF-throttled: a burst of scroll events collapses
 *    into a single layout read per frame.
 *  • Uses React's onScroll prop (one listener, auto-removed on unmount) — no
 *    manual addEventListener, no leak. The pending rAF is cancelled on unmount.
 *
 * @param {unknown} dep  A value whose identity changes whenever the scrollable
 *   content grows — e.g. the `messages` array. In this app each streamed token
 *   replaces `messages` with a new array, so passing `messages` covers both new
 *   messages and streaming growth in one dependency.
 * @param {object} [options]
 * @param {number} [options.threshold=120]  Distance (px) from the bottom that
 *   still counts as "at bottom".
 * @returns {{
 *   scrollRef: import('react').RefObject<HTMLDivElement>,
 *   showJumpButton: boolean,
 *   scrollToBottom: (behavior?: ScrollBehavior) => void,
 *   handleScroll: () => void,
 *   pin: () => void,
 * }}
 */
export function useStickyScroll(dep, { threshold = 120 } = {}) {
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);   // source of truth for "follow new content"
  const rafRef    = useRef(0);
  const [showJumpButton, setShowJumpButton] = useState(false);

  // Read the container's scroll position; update pinned state + button
  // visibility. Only calls setState when the button's visibility flips.
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= threshold;
    pinnedRef.current = atBottom;
    setShowJumpButton(prev => (prev === !atBottom ? prev : !atBottom));
  }, [threshold]);

  // rAF-throttled scroll handler: collapse a burst of scroll events into one
  // layout read per frame.
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      measure();
    });
  }, [measure]);

  // Imperatively re-pin (without scrolling yet). Call right before appending a
  // message the user just triggered — e.g. pressing Send — so the follow effect
  // snaps to it even if they had scrolled up, and the button hides immediately.
  const pin = useCallback(() => {
    pinnedRef.current = true;
    setShowJumpButton(false);
  }, []);

  // Jump to the latest content on demand (the button). Smooth unless the user
  // prefers reduced motion. `scroll-behavior` is not inherited, so the
  // container animates only because we ask it to here — the streaming glue
  // below stays instant.
  const scrollToBottom = useCallback((behavior) => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: behavior ?? (reduce ? 'auto' : 'smooth') });
    pinnedRef.current = true;
    setShowJumpButton(false);
  }, []);

  // Follow new content while pinned. useLayoutEffect runs after the DOM commit
  // but before paint, so the viewport is already at the bottom on the same
  // frame — no flash of not-yet-scrolled content. Instant assignment (not
  // scrollTo) avoids animation build-up during rapid token updates.
  useLayoutEffect(() => {
    if (!pinnedRef.current) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dep]);

  // Cancel any pending rAF on unmount.
  useLayoutEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return { scrollRef, showJumpButton, scrollToBottom, handleScroll, pin };
}
