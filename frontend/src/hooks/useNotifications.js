/**
 * useNotifications — the notification bell's single source of truth.
 *
 * Replaces the two hardcoded MOCK_NOTIFICATIONS arrays that used to live in
 * AppNavbar and NotificationsDrawer. Those asserted specific things about the
 * signed-in user's own account ("Series C Equity analysis is ready to review",
 * "Primary Residence Pivot needs your input") to *every* account, including one
 * that had just registered and owned no simulations at all, and carried a
 * permanent unread badge that no amount of reading could clear.
 *
 * Items now come from GET /api/notifications, which derives them from the
 * caller's own simulations and reports, so every line is checkable against the
 * simulation it names.
 *
 * Both components call this hook. TanStack Query dedupes them onto one request
 * and one cache entry, so the badge in the navbar can never disagree with the
 * list in the drawer.
 *
 * Read state is client-side (localStorage). The server has no per-item read flag
 * to write to, and inventing one would mean a migration for something the user
 * only ever needs on their own device. It is keyed by the item id, which embeds
 * the timestamp it was built from — so regenerating a report produces a new
 * unread item instead of quietly inheriting the dismissal of the previous one.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

const READ_KEY = 'fp:notif:read';
const PREF_KEY = 'fp:notif:prefs';
const CHANGED  = 'notifications:read-changed';
const MAX_READ_IDS = 200;   // bounded so the key cannot grow without limit

/**
 * The notification kinds a user can switch off, and the only ones Settings shows.
 *
 * Settings used to offer four toggles — "Simulation Complete", "AI Advisor
 * Alerts", "Market Updates", "Weekly Digest" — that wrote to a localStorage key
 * nothing ever read. Flipping any of them changed nothing anywhere, and two of
 * them described email this product has no way to send.
 *
 * These two are here because the bell can actually honour them: each corresponds
 * to a `kind` the API emits, so switching one off removes those items from the
 * badge and the drawer immediately. Anything that cannot be honoured does not
 * belong in this list.
 */
export const NOTIF_KINDS = [
  { key: 'report', label: 'Report ready',           desc: 'When a simulation\'s report has finished generating.' },
  { key: 'draft',  label: 'Unfinished simulations', desc: 'A nudge about simulations you started but have not completed.' },
];
const DEFAULT_PREFS = { report: true, draft: true };

export function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY));
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFS };
    // Only known keys, and only booleans — a stale key from an older shape must
    // not switch off a kind the user never chose to hide.
    const out = { ...DEFAULT_PREFS };
    for (const { key } of NOTIF_KINDS) if (typeof raw[key] === 'boolean') out[key] = raw[key];
    return out;
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  const out = {};
  for (const { key } of NOTIF_KINDS) out[key] = prefs?.[key] !== false;
  try { localStorage.setItem(PREF_KEY, JSON.stringify(out)); } catch { /* private mode / quota */ }
  window.dispatchEvent(new CustomEvent(CHANGED));
  return out;
}

function loadRead() {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_KEY));
    return Array.isArray(raw) ? raw.filter(v => typeof v === 'string') : [];
  } catch {
    return [];   // corrupt or unavailable storage — treat everything as unread
  }
}

function saveRead(ids) {
  const trimmed = ids.slice(-MAX_READ_IDS);
  try { localStorage.setItem(READ_KEY, JSON.stringify(trimmed)); } catch { /* private mode / quota */ }
  // Notify the other component instance in this tab; 'storage' only fires cross-tab.
  window.dispatchEvent(new CustomEvent(CHANGED));
}

/**
 * Format an ISO timestamp as coarse relative time.
 * `now` is injectable so this is testable without touching the clock.
 * A stamp in the future (clock skew between the browser and the server) reads as
 * "just now" — never "in 3 hours", and never a negative age.
 */
export function relativeTime(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const secs = Math.round((now - t) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function useNotifications() {
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => apiClient.get('/notifications'),
    enabled:  !!token,          // signed out, there is nothing to show
    staleTime: 60_000,
    retry: 1,
  });

  const [readIds, setReadIds] = useState(loadRead);
  const [prefs, setPrefs]     = useState(loadPrefs);

  useEffect(() => {
    const onChange = () => { setReadIds(loadRead()); setPrefs(loadPrefs()); };
    window.addEventListener(CHANGED, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(CHANGED, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const items = useMemo(() => {
    // The route returns { data, meta }; apiClient already unwrapped the envelope.
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    const read = new Set(readIds);
    return list
      .filter(n => n && typeof n.id === 'string')
      // An unrecognised kind is shown rather than hidden: a new server-side kind
      // this build has no toggle for must not silently vanish from the bell.
      .filter(n => (n.kind in prefs ? prefs[n.kind] : true))
      .map(n => ({ ...n, read: read.has(n.id), time: relativeTime(n.at) }));
  }, [data, readIds, prefs]);

  const unreadCount = items.reduce((n, i) => n + (i.read ? 0 : 1), 0);

  // How many real items the preferences are hiding. Without this the UI would
  // show "No activity yet. Run a simulation…" to someone who has simulations and
  // has simply switched both kinds off — the same species of untrue statement
  // this whole hook exists to remove.
  const hiddenByPrefs = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return list.filter(n => n && typeof n.id === 'string').length - items.length;
  }, [data, items]);

  const markRead = useCallback(id => {
    // Re-read storage rather than trusting state, so two components marking items
    // in the same tick cannot drop each other's write.
    saveRead([...new Set([...loadRead(), id])]);
  }, []);

  const markAllRead = useCallback(() => {
    saveRead([...new Set([...loadRead(), ...items.map(i => i.id)])]);
  }, [items]);

  return {
    items,
    unreadCount,
    hiddenByPrefs,
    loading: isLoading && !!token,
    // Surfaced so the UI can say "couldn't load" instead of silently showing an
    // empty list, which would read as "you have no activity".
    error: error ? (error.message || 'Could not load notifications.') : '',
    markRead,
    markAllRead,
  };
}
