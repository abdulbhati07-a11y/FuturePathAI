import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb }       from '../_lib/db';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const db = getDb();

  if (req.method === 'GET') {
    const u = await db.user.findUnique({ where: { id: user.sub } });
    if (!u) return err(res, 'User not found', 404);
    const roles = Array.isArray(u.roles) ? u.roles : JSON.parse(u.roles as string);
    return ok(res, { id: u.id, name: u.name, email: u.email, roles, profile: u.profile });
  }

  if (req.method === 'PATCH') {
    const { name, email } = req.body ?? {};
    const updated = await db.user.update({
      where: { id: user.sub },
      data: { ...(name && { name }), ...(email && { email }) },
    });
    return ok(res, { id: updated.id, name: updated.name, email: updated.email });
  }

  if (req.method === 'DELETE') {
    await db.simulation.deleteMany({ where: { userId: user.sub } });
    await db.user.delete({ where: { id: user.sub } });
    return ok(res, { deleted: true });
  }

  return err(res, 'Method not allowed', 405);
}
