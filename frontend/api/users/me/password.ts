import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getDb }       from '../../_lib/db';
import { requireAuth } from '../../_lib/auth';
import { ok, err, cors } from '../../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PATCH') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return err(res, 'Both passwords required', 400);
  if (newPassword.length < 8) return err(res, 'New password must be at least 8 characters', 400);

  const db = getDb();
  const u = await db.user.findUnique({ where: { id: user.sub } });
  if (!u) return err(res, 'User not found', 404);

  const match = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!match) return err(res, 'Current password is incorrect', 401);

  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await db.user.update({ where: { id: user.sub }, data: { passwordHash } });

  return ok(res, { updated: true });
}
