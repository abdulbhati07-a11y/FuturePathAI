/**
 * useGlobalSearch — debounced search across simulations and reports.
 *
 * Queries the existing simulations API with a client-side title filter
 * (no dedicated search endpoint needed). Returns grouped results:
 *   { simulations: [...], reports: [...], loading, error }
 */

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

const DEBOUNCE_MS = 280;
const MIN_CHARS   = 2;
const MAX_RESULTS = 5; // per category

export function useGlobalSearch(query) {
  const [results, setResults]   = useState({ simulations: [], reports: [] });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const trimmed = query?.trim() ?? '';

    // Reset immediately when query is too short
    if (trimmed.length < MIN_CHARS) {
      setResults({ simulations: [], reports: [] });
      setLoading(false);
      setError('');
      clearTimeout(timerRef.current);
      return;
    }

    // Debounce the API call
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      // Cancel any in-flight previous request
      if (abortRef.current) abortRef.current.value = true;
      const cancelled = { value: false };
      abortRef.current = cancelled;

      setLoading(true);
      setError('');

      try {
        // Fetch a generous page of the user's simulations; filter client-side by title.
        // Backend returns { data: [...mapped sims], meta }.
        const raw = await apiClient.get('/simulations?limit=50');
        if (cancelled.value) return;

        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const q = trimmed.toLowerCase();

        const simMatches = list
          .filter(s =>
            s.title?.toLowerCase().includes(q) ||
            s.category?.toLowerCase().includes(q)
          )
          .slice(0, MAX_RESULTS)
          .map(s => ({
            id:         s.id,
            title:      s.title,
            subtitle:   `${s.category ?? ''} · ${s.status ?? ''}`.replace(/^·\s|·\s$/, ''),
            type:       'simulation',
            status:     s.status,
            href:       `/simulations/${s.id}/results`,
          }));

        // Use completed simulations as "reports" (same data, different label)
        const reportMatches = list
          .filter(s =>
            s.status === 'COMPLETED' &&
            (s.title?.toLowerCase().includes(q) ||
             s.category?.toLowerCase().includes(q))
          )
          .slice(0, MAX_RESULTS)
          .map(s => ({
            id:       `rep_${s.id}`,
            title:    s.title,
            subtitle: `Report · ${s.category ?? ''}`,
            type:     'report',
            href:     `/simulations/${s.id}/results`,
          }));

        if (!cancelled.value) {
          setResults({ simulations: simMatches, reports: reportMatches });
        }
      } catch (err) {
        if (!cancelled.value) setError(err.message || 'Search failed.');
      } finally {
        if (!cancelled.value) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.value = true;
    };
  }, [query]);

  const totalCount = results.simulations.length + results.reports.length;

  return { results, totalCount, loading, error };
}
