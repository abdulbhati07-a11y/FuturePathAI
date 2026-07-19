import { apiClient } from './client';
import { realTimeSimulation } from '../services/realTimeSimulation';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const USE_REALTIME = import.meta.env.VITE_USE_REALTIME !== 'false'; // Enable real-time by default

/* ─── Mock fallbacks (used only when VITE_USE_MOCKS=true) ──── */
const mockUser = { firstName: 'Sarah', name: 'Sarah Connor', email: 'admin@futurepath.ai', roles: ['USER','PREMIUM','ADMIN'] };

const mockStats = {
  stabilityIndex: { value: 84.2, unit: '%', trend: 'up' },
  riskVector:     { value: 12.5, unit: 'pts', label: 'Low', trend: 'down' },
  projectedCapital: { value: 1.4, unit: 'M', prefix: '$' },
  pathAlpha:      { value: 26, label: 'A/B', trend: 'up' },
};

const mockSimulations = [
  { id: 'sim_1', title: 'Series C Equity Liquidate', category: 'Investment', status: 'COMPLETED',
    riskLevel: 'Low', riskPercent: 14, confidenceScore: 98.2, decisionGrade: 'A+',
    statusTag: 'SAFE PATH', updatedAt: '2024-10-12' },
  { id: 'sim_2', title: 'Primary Residence Pivot', category: 'Relocation', status: 'IN_PROGRESS',
    riskLevel: 'Med', riskPercent: 42, confidenceScore: 76.4, decisionGrade: 'B-',
    statusTag: 'PENDING ACTION', updatedAt: '2024-10-09' },
];

const mockAdvisor = {
  status: 'Current Analysis Active',
  message: 'Based on your Series C Equity simulation, I recommend a tiered liquidation strategy. The current market volatility suggests a 15% delta in potential returns if action is delayed beyond Q4.',
  checklist: [
    { id: 'c1', label: 'Verify tax liability for state exit', done: true },
    { id: 'c2', label: "Run 'Aggressive Reinvestment' simulation", done: false },
    { id: 'c3', label: 'Consult wealth advisor for Series C terms', done: false },
  ],
};

const mockMarketCorrelation = [
  { id: 'm1', label: 'S&P 500 Index', changePercent: 1.24, direction: 'up' },
  { id: 'm2', label: 'Interest Rate (Sim)', changePercent: -5.25, direction: 'down' },
];

const mockMeta = { simulationUptime: 99.98, lastRecalc: '82:45m ago' };

/* ─── Helpers ───────────────────────────────────────────────── */

// Maps the backend /users/me response to the shape the UI expects
function mapUser(raw) {
  if (!raw) return { firstName: 'User', name: 'User', email: '' };
  return {
    id:         raw.id,
    name:       raw.name || `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || 'User',
    firstName:  raw.firstName || raw.name?.split(' ')[0] || 'User',
    lastName:   raw.lastName  || raw.name?.split(' ').slice(1).join(' ') || '',
    email:      raw.email || '',
    roles:      raw.roles || [],
  };
}

// Maps the backend simulation list shape to what RecentSimulations expects
function mapSimulation(sim) {
  const riskScore = sim.riskScore ?? sim.riskPercent ?? 0;
  const riskLevel =
    sim.riskLevel ||
    (riskScore < 30 ? 'Low' : riskScore < 70 ? 'Med' : 'High');

  const decisionScore = sim.decisionScore ?? null;
  const decisionGrade =
    sim.decisionGrade ||
    (decisionScore == null ? 'N/A' :
     decisionScore > 90 ? 'A+' : decisionScore > 80 ? 'A' : 'B');

  return {
    id:             sim.id,
    title:          sim.title,
    category:       sim.category,
    status:         sim.status,
    riskLevel,
    riskPercent:    riskScore,
    confidenceScore: sim.confidenceScore ?? 0,
    decisionGrade,
    statusTag:      sim.statusTag || (sim.status === 'COMPLETED' ? 'SAFE PATH' : 'PENDING ACTION'),
    updatedAt:      sim.updatedAt || sim.createdAt,
  };
}

/* ─── Real API with mock fallbacks ─────────────────────────── */

export async function getCurrentUser() {
  if (USE_MOCKS) return mockUser;
  const raw = await apiClient.get('/users/me');
  return mapUser(raw);
}

export async function getDashboardStats() {
  if (USE_MOCKS) return mockStats;
  // Real-time mode: return live generated stats (no API call needed)
  if (USE_REALTIME) {
    try { return realTimeSimulation.getCurrentData().stats; }
    catch { return mockStats; }
  }
  try {
    return await apiClient.get('/analytics/dashboard-stats');
  } catch {
    return mockStats;
  }
}

export async function getRecentSimulations() {
  if (USE_MOCKS) return mockSimulations;
  // Backend returns: { success, data: { data: [...], meta: {...} } }
  // apiClient unwraps the outer envelope, so raw = { data: [...], meta: {...} }
  const raw = await apiClient.get('/simulations?page=1&limit=5');
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : (raw?.items ?? []);
  return list.map(mapSimulation);
}

export async function getAdvisorInsight() {
  if (USE_MOCKS) return mockAdvisor;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().advisor;
  try {
    const raw = await apiClient.get('/ai/advisor-insight');
    // Backend returns { message, type } — adapt to the panel's expected shape
    return {
      status:   'Current Analysis Active',
      message:  raw?.message || 'No insights available right now.',
      checklist: [
        { id: 'c1', label: 'Review AI recommendation above', done: false },
        { id: 'c2', label: 'Run a new simulation', done: false },
      ],
    };
  } catch {
    return USE_REALTIME ? realTimeSimulation.getCurrentData().advisor : mockAdvisor;
  }
}

export async function getMarketCorrelation() {
  if (USE_MOCKS) return mockMarketCorrelation;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().correlations;
  try {
    return await apiClient.get('/analytics/market-correlation');
  } catch {
    return USE_REALTIME ? realTimeSimulation.getCurrentData().correlations : mockMarketCorrelation;
  }
}

export async function getSystemMeta() {
  if (USE_MOCKS) return mockMeta;
  if (USE_REALTIME) return realTimeSimulation.getCurrentData().meta;
  try {
    return await apiClient.get('/analytics/system-meta');
  } catch {
    return USE_REALTIME ? realTimeSimulation.getCurrentData().meta : mockMeta;
  }
}
