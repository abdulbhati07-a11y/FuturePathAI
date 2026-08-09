import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuid }   from 'uuid';
import { getDb }        from '../../_lib/db';
import { requireAuth }  from '../../_lib/auth';
import { ok, err, cors } from '../../_lib/response';

async function generateReportFromGroq(title: string, category: string, answers: any): Promise<any> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('No GROQ_API_KEY');

  const prompt = `You are an expert AI advisor for FuturePath AI.
Simulation Title: ${title} | Category: ${category}
User Answers: ${JSON.stringify(answers)}

Return ONLY raw JSON (no markdown) with this exact structure:
{"bestCase":{"label":"BEST CASE","probability":22,"title":"...","description":"...","salaryDelta":"+$20k","satisfaction":"9/10"},"mostLikely":{"label":"MOST LIKELY","probability":63,"title":"...","description":"...","salaryDelta":"+$10k","satisfaction":"7/10"},"worstCase":{"label":"WORST CASE","probability":15,"title":"...","description":"...","salaryDelta":"$0k","satisfaction":"4/10"},"rightReasons":["reason1","reason2","reason3"],"wrongReasons":["risk1","risk2","risk3"],"timeline":[{"id":"t1","label":"TODAY","sublabel":"Decision"},{"id":"t2","label":"MONTH 3","sublabel":"Milestone"},{"id":"t3","label":"YEAR 1","sublabel":"Growth"},{"id":"t4","label":"YEAR 3","sublabel":"Maturity"}],"alternatives":[{"id":"alt1","title":"Alternative A","subtitle":"Low risk","score":61},{"id":"alt2","title":"Alternative B","subtitle":"High reward","score":72}]}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = requireAuth(req, res);
  if (!user) return;

  const { simulationId } = req.query as { simulationId: string };
  const db = getDb();

  const sim = await db.simulation.findUnique({ where: { id: simulationId } });
  if (!sim) return err(res, 'Simulation not found', 404);
  if (sim.userId !== user.sub) return err(res, 'Forbidden', 403);

  // Generate AI report
  const answers = typeof sim.answers === 'string' ? JSON.parse(sim.answers) : sim.answers;
  let aiData: any;
  try {
    aiData = await generateReportFromGroq(sim.title, sim.category, answers);
  } catch {
    aiData = {
      bestCase:   { label: 'BEST CASE',   probability: 22, title: 'Optimistic Outcome', description: 'Things go well.',       salaryDelta: '+$20k', satisfaction: '9/10' },
      mostLikely: { label: 'MOST LIKELY', probability: 63, title: 'Expected Outcome',   description: 'Realistic progression.', salaryDelta: '+$10k', satisfaction: '7/10' },
      worstCase:  { label: 'WORST CASE',  probability: 15, title: 'Challenging Path',   description: 'Difficulties arise.',   salaryDelta: '$0k',   satisfaction: '4/10' },
      rightReasons: ['Strong market conditions', 'Your skills are in demand', 'Good timing'],
      wrongReasons: ['Execution risk exists', 'Market may shift', 'Competition is high'],
      timeline:     [{ id: 't1', label: 'TODAY', sublabel: 'Decision' }, { id: 't2', label: 'YEAR 1', sublabel: 'Action' }],
      alternatives: [{ id: 'alt1', title: 'Stay Current', subtitle: 'Safe option', score: 55 }],
    };
  }

  // Upsert report
  await db.report.upsert({
    where:  { simulationId },
    create: {
      id: uuid(), simulationId, userId: user.sub,
      summary:         aiData.mostLikely?.description || 'AI Generated Report',
      chartData:       JSON.stringify([]),
      timeline:        JSON.stringify(aiData.timeline || []),
      scores:          JSON.stringify({ decision: sim.decisionScore ?? 75, risk: sim.riskScore ?? 40, confidence: sim.confidenceScore ?? 80 }),
      recommendations: JSON.stringify(aiData),
    },
    update: {
      summary:         aiData.mostLikely?.description || 'AI Generated Report',
      timeline:        JSON.stringify(aiData.timeline || []),
      scores:          JSON.stringify({ decision: sim.decisionScore ?? 75, risk: sim.riskScore ?? 40, confidence: sim.confidenceScore ?? 80 }),
      recommendations: JSON.stringify(aiData),
    },
  });

  // Mark simulation as COMPLETED
  await db.simulation.update({
    where: { id: simulationId },
    data:  { status: 'COMPLETED' },
  });

  return ok(res, { generated: true, simulationId });
}
