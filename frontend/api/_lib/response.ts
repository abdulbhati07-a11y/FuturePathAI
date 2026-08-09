import type { VercelResponse } from '@vercel/node';

/** Standard success envelope */
export function ok(res: VercelResponse, data: any, status = 200) {
  return res.status(status).json({ success: true, message: 'Success', data, errors: [] });
}

/** Standard error envelope */
export function err(res: VercelResponse, message: string, status = 400) {
  return res.status(status).json({ success: false, message, data: null, errors: [] });
}

/** CORS headers for all API routes */
export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
