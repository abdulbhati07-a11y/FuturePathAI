import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth';
import { ok, err, cors } from '../_lib/response';

const CATEGORIES = ['CAREER', 'FINANCIAL', 'PERSONAL', 'BUSINESS', 'HEALTH', 'EDUCATION'];

function detectCategory(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('job') || m.includes('career') || m.includes('work') || m.includes('salary')) return 'CAREER';
  if (m.includes('invest') || m.includes('money') || m.includes('stock') || m.includes('fund')) return 'FINANCIAL';
  if (m.includes('business') || m.includes('startup') || m.includes('company') || m.includes('entrepreneur')) return 'BUSINESS';
  if (m.includes('school') || m.includes('degree') || m.includes('study') || m.includes('education') || m.includes('mba')) return 'EDUCATION';
  if (m.includes('health') || m.includes('fitness') || m.includes('medical') || m.includes('doctor')) return 'HEALTH';
  return 'PERSONAL';
}

async function getTopicFromGroq(message: string): Promise<{ title: string; category: string }> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Based on this message, give a 2-5 word simulation title and one category from [${CATEGORIES.join(',')}]. Return ONLY JSON: {"title":"...","category":"..."}. Message: "${message}"`,
      }],
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const category = CATEGORIES.includes(parsed.category) ? parsed.category : detectCategory(message);
  return { title: parsed.title || 'New Simulation', category };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const message = req.body?.message || '';
  if (!message) return ok(res, { title: 'New Simulation', category: 'PERSONAL' });

  try {
    const result = await getTopicFromGroq(message);
    return ok(res, result);
  } catch {
    return ok(res, { title: 'New Simulation', category: detectCategory(message) });
  }
}
