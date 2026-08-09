import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);
  const user = requireAuth(req, res);
  if (!user) return;
  return ok(res, {
    simulationUptime: +(99.95 + Math.random() * 0.04).toFixed(2),
    lastRecalc: `${Math.floor(Math.random() * 120) + 1}s ago`,
  });
}
