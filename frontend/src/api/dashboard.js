import { apiClient } from './client';
import { realTimeSimulation } from '../services/realTimeSimulation';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const USE_REALTIME = import.meta.env.VITE_USE_REALTIME !== 'false';

// Live dashboard metrics (stability, risk, capital, market correlations) are
// generated client-side by realTimeSimulation for a premium "live" feel. Only the
// Recent Simulations list is real data, pulled from the serverless backend.
const mockStats = {
  stabilityIndex: { value: 84.2, unit: '%', trend: 'up' },
  riskVector:     { value: 12.5, unit: 'pts', label: 'Low', trend: 'down' },
  projectedCapital: { value: 1.4, unit: 'M', prefix: '$' },
  pathAlpha:      { value: 26, label: 'A/B', trend: 'up' },
};
const mockSimulations = [];
const mockAdvisor = { status: 'Current Analysis Active', message: 'No insights.', checklist: [] };
const mockMarketCorrelation = [];
const mockMeta = { simulationUptime: 99.98, lastRecalc: '82:45m ago' };

export async function getDashboardStats() {
  if (USE_MOCKS) return mockStats;
  if (USE_REALTIME) {
    try { return realTimeSimulation.getCurrentData().stats; }
    catch { return mockStats; }
  }
  return mockStats;
}

export async function getRecentSimulations() {
  if (USE_MOCKS) return mockSimulations;

  // Backend returns { data: [...mapped sims], meta } already shaped for the UI.
  const raw = await apiClient.get('/simulations?limit=5');
  return Array.isArray(raw) ? raw : (raw?.data ?? []);
}

export async function getAdvisorInsight() {
  if (USE_MOCKS) return mockAdvisor;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().advisor;
  return mockAdvisor;
}

export async function getMarketCorrelation() {
  if (USE_MOCKS) return mockMarketCorrelation;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().correlations;
  return mockMarketCorrelation;
}

export async function getSystemMeta() {
  if (USE_MOCKS) return mockMeta;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().meta;
  return mockMeta;
}
