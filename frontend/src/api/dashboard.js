import { apiClient } from './client';

/**
 * Dashboard data. Both calls hit the real backend now.
 *
 * This file used to be the seam where the dashboard stopped being real. Only
 * getRecentSimulations() fetched anything; the other four exports returned
 * `realTimeSimulation.getCurrentData()`, a browser-side generator that made up
 * every headline figure from Math.random() and re-made it up every two seconds:
 *
 *   stabilityIndex: 84.2%   "Market Volatility Analysis"
 *   projectedCapital: $1.4M "Portfolio Projection"
 *   pathAlpha: +26%         "Decision Engine Output"
 *   plus S&P 500 / NASDAQ / VIX / interest-rate moves, a randomly chosen "AI
 *   Advisor" insight, a checklist whose ticks were re-rolled every tick, and a
 *   99.95% "simulation uptime".
 *
 * The switch that fed them, VITE_USE_REALTIME, defaulted to ON (`!== 'false'`),
 * so the invented numbers were what production shipped. The service and its
 * mock fallbacks are gone; the figures now come from /dashboard/summary, which
 * aggregates the signed-in user's own simulations and reports.
 */
export async function getDashboardSummary() {
  return apiClient.get('/dashboard/summary');
}

export async function getRecentSimulations() {
  // Backend returns { data: [...mapped sims], meta } already shaped for the UI.
  const raw = await apiClient.get('/simulations?limit=5');
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}
