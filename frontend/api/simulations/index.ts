import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';
import { v4 as uuid }   from 'uuid';

function mapSim(sim: any) {
  const riskScore = sim.riskScore ?? 0;
  return {
    id: sim.id, title: sim.title, category: sim.category, status: sim.status,
    isPublic: sim.isPublic,
    riskLevel: riskScore < 30 ? 'Low' : riskScore < 70 ? 'Med' : 'High',
    riskPercent: riskScore,
    confidenceScore: sim.confidenceScore ?? 0,
    decisionScore: sim.decisionScore,
    riskScore: sim.riskScore,
    decisionGrade: sim.decisionScore
      ? sim.decisionScore > 90 ? 'A+' : sim.decisionScore > 80 ? 'A' : 'B'
      : 'N/A',
    statusTag: sim.status === 'COMPLETED' ? 'SAFE PATH' : 'PENDING ACTION',
    updatedAt: sim.updatedAt,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const db = getDb();

  // GET — list simulations
  if (req.method === 'GET') {
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const where: any = { userId: user.sub };
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.category) where.category = req.query.category;

    const [sims, total] = await Promise.all([
      db.simulation.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
      db.simulation.count({ where }),
    ]);
    return ok(res, { data: sims.map(mapSim), meta: { total, page, limit } });
  }

  // POST — create simulation
  if (req.method === 'POST') {
    const { title, category } = req.body ?? {};
    if (!title || !category) return err(res, 'title and category required', 400);

    const sim = await db.simulation.create({
      data: {
        id: uuid(),
        userId: user.sub,
        title,
        category,
        status: 'DRAFT',
        answers: '{}',
        generatedQuestions: '[]',
      },
    });
    return ok(res, mapSim(sim), 201);
  }

  return err(res, 'Method not allowed', 405);
}
