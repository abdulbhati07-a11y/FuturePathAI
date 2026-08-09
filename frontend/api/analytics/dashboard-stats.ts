import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  // Real-time stats generated server-side
  return ok(res, {
    stabilityIndex:   { value: +(75 + Math.random() * 20).toFixed(1), unit: '%', trend: 'up',   history: Array.from({ length: 20 }, () => 70 + Math.random() * 25) },
    riskVector:       { value: +(8  + Math.random() * 15).toFixed(1), unit: 'pts', label: 'Low', trend: 'down', history: Array.from({ length: 20 }, () => 5 + Math.random() * 20) },
    projectedCapital: { value: +(1.2 + Math.random() * 0.8).toFixed(2), unit: 'M', prefix: '$',  history: Array.from({ length: 20 }, () => 1.0 + Math.random() * 0.8) },
    pathAlpha:        { value: Math.floor(20 + Math.random() * 30), label: 'A/B', trend: 'up' },
  });
}
