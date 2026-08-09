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
    message: 'Market volatility is up 12% this week. Consider reviewing your high-risk equities and stress-testing your current simulation assumptions.',
    type: 'warning',
    status: 'Current Analysis Active',
    checklist: [
      { id: 'c1', label: 'Review AI recommendation above', done: false },
      { id: 'c2', label: 'Run a new simulation', done: false },
    ],
  });
}
