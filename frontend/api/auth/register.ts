import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getDb }     from '../_lib/db';
import { signToken } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) return err(res, 'Name, email and password required', 400);
  if (password.length < 8) return err(res, 'Password must be at least 8 characters', 400);

  const db = getDb();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return err(res, 'Email already in use', 409);

  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await db.user.create({
    data: { email, name, passwordHash, roles: JSON.stringify(['USER']) },
  });

  const roles = ['USER'];
  const accessToken = signToken({ sub: user.id, email: user.email, roles });

  return ok(res, {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, roles },
  }, 201);
}
