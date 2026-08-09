import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db';
import { ok, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();
  const sims = await db.simulation.findMany({
    where: { isPublic: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return ok(res, sims.map((s: any) => ({
    id: s.id, title: s.title, category: s.category,
    status: s.status, isPublic: s.isPublic,
    riskLevel: (s.riskScore ?? 0) < 30 ? 'Low' : (s.riskScore ?? 0) < 70 ? 'Med' : 'High',
    riskPercent: s.riskScore ?? 0,
    confidenceScore: s.confidenceScore ?? 0,
    updatedAt: s.updatedAt,
    authorName: s.user?.name || 'Anonymous',
  })));
}
