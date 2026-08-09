import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../../_lib/db';
import { requireAuth } from '../../_lib/auth';
import { ok, err, cors } from '../../_lib/response';

// Fallback mock result when no AI report has been generated yet
function mockResult(sim: any) {
  return {
    id: sim.id, title: sim.title, isPublic: sim.isPublic,
    finalizedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overallRisk: (sim.riskScore ?? 50) < 30 ? 'Low' : (sim.riskScore ?? 50) < 70 ? 'Moderate' : 'High',
    riskLabel: 'AI Assessed',
    confidence: sim.confidenceScore ?? 75,
    bestCase:   { label: 'BEST CASE',   probability: 22, title: 'Optimistic Outcome', description: 'Things go well.', salaryDelta: '+$20k', satisfaction: '9/10' },
    mostLikely: { label: 'MOST LIKELY', probability: 63, title: 'Expected Outcome',   description: 'Realistic progression.', salaryDelta: '+$10k', satisfaction: '7/10' },
    worstCase:  { label: 'WORST CASE',  probability: 15, title: 'Pessimistic Outcome', description: 'Challenges arise.', salaryDelta: '$0k', satisfaction: '4/10' },
    rightReasons:  ['Strong alignment with your stated values', 'Market timing is favourable'],
    wrongReasons:  ['Execution risk is non-trivial', 'External factors may intervene'],
    timeline:    [
      { id: 't1', label: 'TODAY',  sublabel: 'Decision' },
      { id: 't2', label: 'MONTH 3', sublabel: 'Action' },
      { id: 't3', label: 'YEAR 1', sublabel: 'Milestone' },
      { id: 't4', label: 'YEAR 3', sublabel: 'Growth' },
    ],
    alternatives: [
      { id: 'alt1', title: 'Stay Current Path', subtitle: 'Low risk, low reward', score: 55 },
      { id: 'alt2', title: 'Aggressive Pivot',  subtitle: 'High risk, high reward', score: 68 },
    ],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };
  const db = getDb();

  const sim = await db.simulation.findUnique({ where: { id } });
  if (!sim) return err(res, 'Simulation not found', 404);
  if (sim.userId !== user.sub) return err(res, 'Forbidden', 403);

  // Try to find AI-generated report
  const report = await db.report.findUnique({ where: { simulationId: id } });

  if (!report) return ok(res, mockResult(sim));

  const recs: any = typeof report.recommendations === 'string'
    ? JSON.parse(report.recommendations) : report.recommendations ?? {};
  const timeline: any = typeof report.timeline === 'string'
    ? JSON.parse(report.timeline) : report.timeline ?? [];

  return ok(res, {
    id: sim.id, title: sim.title, isPublic: sim.isPublic,
    finalizedDate: report.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    overallRisk: (sim.riskScore ?? 50) < 30 ? 'Low' : (sim.riskScore ?? 50) < 70 ? 'Moderate' : 'High',
    riskLabel: 'AI Assessed',
    confidence: sim.confidenceScore ?? 75,
    bestCase:    recs.bestCase,
    mostLikely:  recs.mostLikely,
    worstCase:   recs.worstCase,
    rightReasons: recs.rightReasons ?? [],
    wrongReasons: recs.wrongReasons ?? [],
    timeline,
    alternatives: recs.alternatives ?? [],
  });
}
