import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);
  const user = requireAuth(req, res);
  if (!user) return;

  const change = (base: number, vol: number) => +( base + (Math.random() - 0.5) * vol ).toFixed(2);
  return ok(res, [
    { id: 'm1', label: 'S&P 500 Index',      changePercent: change(1.24, 1.6),  direction: 'up'   },
    { id: 'm2', label: 'Interest Rate (Sim)', changePercent: change(-5.25, 2.4), direction: 'down' },
    { id: 'm3', label: 'NASDAQ Composite',    changePercent: change(0.87, 3.0),  direction: 'up'   },
    { id: 'm4', label: 'VIX Index',           changePercent: change(2.34, 4.0),  direction: 'up'   },
  ]);
}
