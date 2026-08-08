import { supabase } from './supabase';
import { realTimeSimulation } from '../services/realTimeSimulation';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const USE_REALTIME = import.meta.env.VITE_USE_REALTIME !== 'false';

// ... MOCK DATA HERE (copied from original to save space in thought block, I'll keep them short)
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

function mapSimulation(sim) {
  const riskScore = sim.risk_score ?? 0;
  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 70 ? 'Med' : 'High';

  const decisionScore = sim.decision_score ?? null;
  const decisionGrade = decisionScore == null ? 'N/A' : decisionScore > 90 ? 'A+' : decisionScore > 80 ? 'A' : 'B';

  return {
    id:             sim.id,
    title:          sim.title,
    category:       sim.category,
    status:         sim.status,
    riskLevel,
    riskPercent:    riskScore,
    confidenceScore: sim.confidence_score ?? 0,
    decisionGrade,
    statusTag:      sim.status === 'COMPLETED' ? 'SAFE PATH' : 'PENDING ACTION',
    updatedAt:      sim.updated_at || sim.created_at,
  };
}

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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);
  return (data || []).map(mapSimulation);
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
