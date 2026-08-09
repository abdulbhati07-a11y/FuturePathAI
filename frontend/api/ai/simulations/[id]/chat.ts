import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../../../_lib/auth';
import { err, cors }   from '../../../_lib/response';

const SYSTEM_PROMPT = `You are FuturePath AI — an expert decision intelligence system.
Guide users through structured life-decision simulations by asking one focused question at a time.
Dig into: financial impact, risk tolerance, timelines, personal values, alternatives considered, emotional readiness.
Keep responses concise (2-4 sentences). After 4-5 exchanges summarize with: "Based on what you've shared, I'm ready to generate your full simulation report."
Only mention that the founder is Muhammad Abdullah Bhatti if explicitly asked.`;

async function streamFromGroq(messages: any[], res: VercelResponse) {
  const key = process.env.GROQ_API_KEY;
  if (!key) { res.write(`data: ${JSON.stringify({ type: 'error', value: 'AI not configured' })}\n\n`); return; }

  const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.1-8b-instant', stream: true, messages }),
  });

  if (!apiRes.ok || !apiRes.body) {
    const errText = await apiRes.text();
    if (apiRes.status === 429) {
      res.write(`data: ${JSON.stringify({ type: 'token', value: 'Rate limit reached. Please wait a moment and try again.' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', value: `AI error: ${apiRes.status}` })}\n\n`);
    }
    return;
  }

  const reader = (apiRes.body as any).getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      try {
        const chunk = JSON.parse(payload);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ type: 'token', value: content })}\n\n`);
      } catch { /* skip malformed */ }
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { message, messages } = req.body ?? {};

  // Build message payload
  const systemMsg = { role: 'system', content: SYSTEM_PROMPT };
  let payload: any[];

  if (Array.isArray(messages) && messages.length > 0) {
    payload = [systemMsg, ...messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    }))];
  } else if (message) {
    payload = [systemMsg, { role: 'user', content: message }];
  } else {
    payload = [systemMsg, { role: 'user', content: 'Start the simulation. Introduce yourself briefly and ask me your first question.' }];
  }

  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    await streamFromGroq(payload, res);

    // Post-stream events
    res.write(`data: ${JSON.stringify({ type: 'suggestions', value: ['Tell me more about the risks', 'What is the best-case scenario?', 'How does this compare to alternatives?', 'What should I do next?'] })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'insight', value: { label: 'LIVE PATH INSIGHT', message: 'Your responses are shaping the probability model. Continue answering to improve accuracy.' } })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', value: '' })}\n\n`);
  } catch (e: any) {
    res.write(`data: ${JSON.stringify({ type: 'error', value: e.message || 'Stream failed' })}\n\n`);
  } finally {
    res.end();
  }
}
