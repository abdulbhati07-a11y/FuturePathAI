import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

function mapSim(sim: any) {
  const riskScore = sim.riskScore ?? 0;
  return {
    id: sim.id, title: sim.title, category: sim.category,
    status: sim.status, isPublic: sim.isPublic,
    riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Med' : 'High',
    riskPercent: riskScore, confidenceScore: sim.confidenceScore ?? 0,
    decisionScore: sim.decisionScore, riskScore: sim.riskScore,
    answers: sim.answers, generatedQuestions: sim.generatedQuestions,
    decisionGrade: sim.decisionScore
      ? sim.decisionScore > 90 ? 'A+' : sim.decisionScore > 80 ? 'A' : 'B' : 'N/A',
    statusTag: sim.status === 'COMPLETED' ? 'SAFE PATH' : 'PENDING ACTION',
    updatedAt: sim.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };
  const db = getDb();

  const sim = await db.simulation.findUnique({ where: { id } });
  if (!sim) return err(res, 'Simulation not found', 404);
  if (sim.userId !== user.sub) return err(res, 'Forbidden', 403);

  if (req.method === 'GET') return ok(res, mapSim(sim));

  if (req.method === 'PATCH') {
    const data: any = {};
    const body = req.body ?? {};
    if (body.title)    data.title    = body.title;
    if (body.category) data.category = body.category;
    if (body.status)   data.status   = body.status;
    if (body.isPublic !== undefined) data.isPublic = body.isPublic;
    if (body.answers)  { data.answers = JSON.stringify(body.answers); data.status = 'IN_PROGRESS'; }

    const updated = await db.simulation.update({ where: { id }, data });
    return ok(res, mapSim(updated));
  }

  if (req.method === 'DELETE') {
    await db.simulation.delete({ where: { id } });
    return ok(res, { deleted: true });
  }

  return err(res, 'Method not allowed', 405);
}
