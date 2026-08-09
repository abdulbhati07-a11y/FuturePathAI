import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../../_lib/db';
import { requireAuth } from '../../_lib/auth';
import { ok, err, cors } from '../../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { simulationId } = req.query as { simulationId: string };
  const db = getDb();

  const report = await db.report.findUnique({ where: { simulationId } });
  if (!report) return err(res, 'Report not found', 404);

  const recs: any    = typeof report.recommendations === 'string' ? JSON.parse(report.recommendations) : report.recommendations ?? {};
  const timeline: any = typeof report.timeline === 'string' ? JSON.parse(report.timeline) : report.timeline ?? [];

  return ok(res, {
    id: report.id, simulationId: report.simulationId,
    summary: report.summary, timeline,
    recommendations: recs,
    scores: typeof report.scores === 'string' ? JSON.parse(report.scores) : report.scores,
    createdAt: report.createdAt, updatedAt: report.updatedAt,
  });
}
