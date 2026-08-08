import { supabase } from './supabase';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const mockResult = {
  title: 'Should I take the senior role in Berlin?',
  finalizedDate: 'Oct 24, 2024',
  overallRisk: 'Moderate',
  riskLabel: 'Strong Align',
  confidence: 94.2,
  bestCase: {
    label: 'BEST CASE',
    probability: 22,
    title: 'Rapid promotion to VP Engineering within 2 years due to that fast-growth.',
    description: 'Rapid promotion to VP Engineering within 2 years due to that fast-growth.',
    salaryDelta: '€165k',
    satisfaction: '9.2/10',
  },
  mostLikely: {
    label: 'MOST LIKELY',
    probability: 63,
    title: 'Steady career growth, high work-life balance, and moderate relocation overhead.',
    description: 'Steady career growth, high work-life balance, and moderate relocation overhead.',
    salaryDelta: '€118k',
    satisfaction: '7.6/10',
  },
  worstCase: {
    label: 'WORST CASE',
    probability: 15,
    title: 'Company restructuring leads to layoffs within 12 months; relocation costs sunk.',
    description: 'Company restructuring leads to layoffs within 12 months; relocation costs sunk.',
    salaryDelta: '€119k',
    satisfaction: '4.1/10',
  },
  rightReasons: [
    "Berlin's budgeting tech hub status provides high liquidity for your specific skill set if the first job fails.",
    'Salary increase in real disposable income despite higher nominal taxes due to lower cost of living.',
    'Strong alignment with your "Long-term Security" value; German labor protections are historically robust.',
  ],
  wrongReasons: [
    'Significant bureaucracy (up to 16-4 months) for non-EU partner work permit processing.',
    'Housing market volatility in Mitte/Prenzlauer Berg may exceed current stipend buffers.',
    'Language barrier in mid-management might limit "soft-influence" project success in year 1.',
  ],
  timeline: [
    { id: 't1', label: 'TODAY', sublabel: 'Decision' },
    { id: 't2', label: 'WEEK 1', sublabel: 'Relocation' },
    { id: 't3', label: 'YEAR 1', sublabel: 'Settled' },
    { id: 't4', label: 'YEAR 3', sublabel: 'Promotion' },
    { id: 't5', label: 'YEAR 10', sublabel: 'US Remote Offer' },
  ],
  alternatives: [
    { id: 'alt1', title: 'Stay in current role', subtitle: 'Low risk, low opportunity', score: 61 },
    { id: 'alt2', title: 'Freelance High Path', subtitle: 'High risk, high reward', score: 54 },
    { id: 'alt3', title: 'US Remote Offer', subtitle: 'Tax complexity, highest pay', score: 72 },
  ],
};

export async function getSimulationResult(simulationId) {
  if (USE_MOCKS) return mockResult;
  
  const { data: sim, error: simErr } = await supabase
    .from('simulations')
    .select('*')
    .eq('id', simulationId)
    .single();

  if (simErr) throw new Error(simErr.message);

  const { data: report, error: repErr } = await supabase
    .from('reports')
    .select('*')
    .eq('simulation_id', simulationId)
    .single();

  if (repErr) throw new Error("Report not generated yet for this simulation");

  const aiData = report.recommendations || {};

  return {
    id: sim.id,
    title: sim.title,
    isPublic: sim.is_public,
    finalizedDate: new Date(report.updated_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    overallRisk: sim.risk_score
      ? sim.risk_score < 30
        ? 'Low'
        : sim.risk_score < 70
          ? 'Moderate'
          : 'High'
      : 'Moderate',
    riskLabel: 'Determined by AI',
    confidence: sim.confidence_score || 94,
    bestCase: aiData.bestCase,
    mostLikely: aiData.mostLikely,
    worstCase: aiData.worstCase,
    rightReasons: aiData.rightReasons || [],
    wrongReasons: aiData.wrongReasons || [],
    timeline: report.timeline || aiData.timeline || [],
    alternatives: aiData.alternatives || [],
  };
}

export async function toggleSimulationPublic(simulationId, isPublic) {
  if (USE_MOCKS) return { isPublic };
  const { data, error } = await supabase
    .from('simulations')
    .update({ is_public: isPublic })
    .eq('id', simulationId)
    .select();
  if (error) throw new Error(error.message);
  return { isPublic: data[0].is_public };
}
