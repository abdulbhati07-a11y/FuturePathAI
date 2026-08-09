import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../../_lib/db';
import { requireAuth } from '../../_lib/auth';
import { ok, err, cors } from '../../_lib/response';

function calculateScores(answers: any) {
  const answerCount = typeof answers === 'object' ? Object.keys(answers).length : 0;
  const riskScore       = Math.max(72 - answerCount * 5, 40);
  const confidenceScore = Math.min(55 + answerCount * 8, 95);
  const decisionScore   = Math.min(100 - riskScore * 0.5 + (confidenceScore - 70) * 0.3, 99);
  return { riskScore, confidenceScore, decisionScore: Math.round(decisionScore) };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };
  const db = getDb();

  const sim = await db.simulation.findUnique({ where: { id } });
  if (!sim) return err(res, 'Simulation not found', 404);
  if (sim.userId !== user.sub) return err(res, 'Forbidden', 403);

  const answers = typeof sim.answers === 'string' ? JSON.parse(sim.answers) : sim.answers;
  const scores = calculateScores(answers);

  const updated = await db.simulation.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      riskScore:       scores.riskScore,
      confidenceScore: scores.confidenceScore,
      decisionScore:   scores.decisionScore,
    },
  });

  return ok(res, { id: updated.id, status: updated.status, ...scores });
}
