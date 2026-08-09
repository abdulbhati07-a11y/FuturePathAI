import jwt from 'jsonwebtoken';
import type { VercelRequest } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

/** Extract and verify the Bearer token from a request. Returns null if invalid. */
export function getUser(req: VercelRequest): JwtPayload | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** Require authentication — returns user or sends 401 */
export function requireAuth(req: VercelRequest, res: any): JwtPayload | null {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  return user;
}

export function signToken(payload: { sub: string; email: string; roles: string[] }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}
