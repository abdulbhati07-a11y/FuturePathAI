import { apiClient } from './client';

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
  // Mirrors the shape the API now returns: a causal claim, the user's own figures
  // behind it, and — on the risk side — the earliest signal it is arriving.
  rightReasons: [
    {
      point: "Berlin's density of fintech employers means a failed first job costs you weeks, not a relocation.",
      evidence: 'Your skill set matches the stack listed by most of the hub, so a second search starts warm.',
    },
    {
      point: 'Real disposable income rises even though the nominal tax rate does.',
      evidence: 'The higher gross more than covers the lower cost of living you described.',
    },
    {
      point: 'German labour protections match the long-term security you ranked first.',
      evidence: 'You named security as the value you would not trade for pay.',
    },
  ],
  wrongReasons: [
    {
      point: 'Your partner may be unable to work for most of year one, halving household income exactly while relocation costs land.',
      evidence: 'Non-EU work permits run four to sixteen months, against the single income you would be on.',
      watchFor: 'No permit appointment booked by month two',
    },
    {
      point: 'Rent in the districts you shortlisted can outrun the relocation stipend and eat into savings.',
      evidence: 'Mitte and Prenzlauer Berg sit above the buffer your stipend allows for.',
      watchFor: 'Three viewings above budget in one week',
    },
    {
      point: 'Working in English at mid-management limits the informal influence your first-year projects depend on.',
      evidence: 'The projects you described are carried by persuasion rather than formal authority.',
      watchFor: 'Decisions being made in meetings you are not in',
    },
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

/**
 * Fetch a simulation's finalized report. The backend endpoint is public when the
 * simulation is shared (isPublic), so this works for both the owner and anyone
 * opening a share link. The response is already fully shaped for the Results page.
 */
export async function getSimulationResult(simulationId) {
  if (USE_MOCKS) return mockResult;
  return apiClient.get(`/simulations/${simulationId}/results`);
}

/** Toggle a simulation's public/shareable flag. */
export async function toggleSimulationPublic(simulationId, isPublic) {
  if (USE_MOCKS) return { isPublic };
  const sim = await apiClient.patch(`/simulations/${simulationId}`, { isPublic });
  return { isPublic: sim?.isPublic ?? isPublic };
}
