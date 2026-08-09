import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getDb }    from '../_lib/db';
import { signToken } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const { email, password } = req.body ?? {};
  if (!email || !password) return err(res, 'Email and password required', 400);

  const db = getDb();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return err(res, 'Invalid credentials', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return err(res, 'Invalid credentials', 401);

  const roles: string[] = Array.isArray(user.roles) ? user.roles as string[] : JSON.parse(user.roles as string);
  const accessToken = signToken({ sub: user.id, email: user.email, roles });

  return ok(res, {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, roles },
  });
}
