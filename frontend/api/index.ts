import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { v4 as uuid } from 'uuid';
import { createRequire } from 'node:module';
// Prisma 7's client is CommonJS, but this file compiles to ESM (package.json has
// "type": "module"), where a bare `require` is undefined. createRequire restores it;
// the string-literal argument keeps @prisma/client traceable so Vercel bundles it.
// The type is imported separately (type-only import is erased at build).
import type { PrismaClient as PrismaClientType } from '@prisma/client';
const require = createRequire(import.meta.url);
// @ts-ignore — Prisma 7 client export
const { PrismaClient } = require('@prisma/client');

// ── DB ────────────────────────────────────────────────────────────────────────
let _prisma: PrismaClientType;
function db() {
  if (!_prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
    _prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as any);
  }
  return _prisma;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
// No guessable fallback: if JWT_SECRET is unset the API fails closed (no tokens
// can be minted or verified) rather than signing with a well-known default.
const SECRET = process.env.JWT_SECRET;
if (!SECRET) console.error('FATAL: JWT_SECRET is not set — authentication is disabled until it is configured.');
function sign(payload: object) {
  if (!SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, SECRET, { expiresIn: '15m' });
}
function verify(token: string): any {
  if (!SECRET) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
function getUser(req: VercelRequest) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return verify(h.slice(7));
}

// ── Response helpers ──────────────────────────────────────────────────────────
function ok(res: VercelResponse, data: any, status = 200) {
  return res.status(status).json({ success: true, message: 'Success', data, errors: [] });
}
function err(res: VercelResponse, msg: string, status = 400) {
  return res.status(status).json({ success: false, message: msg, data: null, errors: [] });
}
function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}
function auth(req: VercelRequest, res: VercelResponse) {
  const u = getUser(req);
  if (!u) { err(res, 'Unauthorized', 401); return null; }
  return u;
}

// ── Simulation mapper ─────────────────────────────────────────────────────────
function mapSim(s: any) {
  const r = s.riskScore ?? 0;
  return {
    id: s.id, title: s.title, category: s.category, status: s.status, isPublic: s.isPublic,
    riskLevel: r < 30 ? 'Low' : r < 70 ? 'Med' : 'High', riskPercent: r,
    confidenceScore: s.confidenceScore ?? 0, decisionScore: s.decisionScore,
    riskScore: s.riskScore, answers: s.answers, generatedQuestions: s.generatedQuestions,
    decisionGrade: s.decisionScore ? (s.decisionScore > 90 ? 'A+' : s.decisionScore > 80 ? 'A' : 'B') : 'N/A',
    statusTag: s.status === 'COMPLETED' ? 'SAFE PATH' : 'PENDING ACTION',
    updatedAt: s.updatedAt,
  };
}
function calcScores(answers: any) {
  const n = typeof answers === 'object' ? Object.keys(answers).length : 0;
  const risk = Math.max(72 - n * 5, 40), conf = Math.min(55 + n * 8, 95);
  return { riskScore: risk, confidenceScore: conf, decisionScore: Math.round(100 - risk * 0.5 + (conf - 70) * 0.3) };
}

// ── AI helpers ────────────────────────────────────────────────────────────────
async function aiChat(messages: any[], stream = false): Promise<Response> {
  // Primary: Groq (fast, free). Automatic fallback: Google Gemini via its
  // OpenAI-compatible endpoint — identical request body and response shape
  // (streaming + non-streaming), so no call site needs to change. Gemini only
  // engages when GEMINI_API_KEY is set AND Groq is rate-limited/errors/unreachable.
  const hasGemini    = !!process.env.GEMINI_API_KEY;
  const GROQ_MODEL   = process.env.GROQ_MODEL   || 'openai/gpt-oss-120b';
  const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

  const call = (url: string, key: string, model: string) => fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream, messages }),
  });

  // 1) Primary — Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const r = await call('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_API_KEY, GROQ_MODEL);
      if (r.ok || !hasGemini) return r;   // success, or no backup to fall over to
    } catch (e) {
      if (!hasGemini) throw e;            // network error and no backup → surface it
    }
  }

  // 2) Backup — Gemini (OpenAI-compatible; same shapes as Groq)
  if (hasGemini) {
    return call('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', process.env.GEMINI_API_KEY!, GEMINI_MODEL);
  }

  // 3) Nothing configured — synthesize an error the callers' !res.ok / try-catch handle.
  return new Response(
    JSON.stringify({ error: 'No AI provider configured (set GROQ_API_KEY and/or GEMINI_API_KEY).' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );
}
const SYSTEM = `You are FuturePath AI — an expert decision intelligence system. Guide users through life-decision simulations by asking one focused question at a time. Keep responses concise (2-4 sentences).

After each question, offer 3-4 likely answers as lettered options on their own lines, formatted exactly as:
A) <short answer>
B) <short answer>
C) <short answer>
Keep each option under 60 characters. These render as tappable chips, but the user may also type their own answer, so never say "choose A/B/C" — phrase the question so a free-text reply works too. Do not add options to statements that aren't questions.

After 4-5 exchanges say: "I'm ready to generate your full simulation report."`;

function detectCategory(m: string) {
  const l = m.toLowerCase();
  if (l.includes('job')||l.includes('career')||l.includes('work')) return 'CAREER';
  if (l.includes('invest')||l.includes('money')||l.includes('stock')) return 'FINANCIAL';
  if (l.includes('business')||l.includes('startup')) return 'BUSINESS';
  if (l.includes('school')||l.includes('degree')||l.includes('mba')) return 'EDUCATION';
  if (l.includes('health')||l.includes('medical')) return 'HEALTH';
  return 'PERSONAL';
}

// Fallback quick-answers per category — sent only when the AI omits its own
// lettered options, so the composer still shows tappable chips.
const QUICK_ANSWERS: Record<string, string[]> = {
  CAREER:    ['Prioritize higher pay', 'Prioritize growth & learning', 'Weigh work-life balance', 'What are the biggest risks?'],
  FINANCIAL: ['I want lower risk', 'I want higher returns', 'Keep it liquid & flexible', 'What is the downside scenario?'],
  BUSINESS:  ['Start lean and test demand', 'Raise funding first', 'Keep my day job for now', 'What could go wrong?'],
  EDUCATION: ['Study full-time', 'Study part-time while working', 'Consider the cost vs payoff', 'What are the alternatives?'],
  HEALTH:    ['Focus on long-term outcome', 'Prioritize quality of life', 'Consider the recovery time', 'What are the trade-offs?'],
  PERSONAL:  ['Tell me more about the risks', 'What is the best-case scenario?', 'Weigh the pros and cons', 'What should I do next?'],
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ROUTER
// ══════════════════════════════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.url || '';
  // Strip query string, then a leading /api so every route below is prefix-agnostic.
  // The function is mounted at /api/* by vercel.json — stripping it here keeps the
  // route table readable and lets the same handler run locally at either path.
  const path = url.split('?')[0].replace(/^\/api(?=\/|$)/, '').replace(/\/$/, '') || '/';
  const p = (prefix: string) => path.startsWith(prefix);
  const seg = (n: number) => path.split('/')[n] || '';
  const prisma = db();

  try {

    // ── /auth/login ───────────────────────────────────────────────────────────
    if (path === '/auth/login' && req.method === 'POST') {
      const { email, password } = req.body ?? {};
      if (!email || !password) return err(res, 'Email and password required', 400);
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return err(res, 'Invalid credentials', 401);
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return err(res, 'Invalid credentials', 401);
      const roles = Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles as string);
      return ok(res, { accessToken: sign({ sub: user.id, email: user.email, roles }), user: { id: user.id, email: user.email, name: user.name, roles } });
    }

    // ── /auth/register ────────────────────────────────────────────────────────
    if (path === '/auth/register' && req.method === 'POST') {
      const { name, email, password } = req.body ?? {};
      if (!name || !email || !password) return err(res, 'Name, email and password required', 400);
      if (password.length < 8) return err(res, 'Password must be at least 8 characters', 400);
      if (await prisma.user.findUnique({ where: { email } })) return err(res, 'Email already in use', 409);
      const hash = await bcrypt.hash(password, await bcrypt.genSalt());
      const user = await prisma.user.create({ data: { id: uuid(), email, name, passwordHash: hash, roles: JSON.stringify(['USER']) } });
      const roles = ['USER'];
      return ok(res, { accessToken: sign({ sub: user.id, email: user.email, roles }), user: { id: user.id, email: user.email, name: user.name, roles } }, 201);
    }

    // ── /users/me ─────────────────────────────────────────────────────────────
    if (path === '/users/me') {
      const u = auth(req, res); if (!u) return;
      if (req.method === 'GET') {
        const user = await prisma.user.findUnique({ where: { id: u.sub } });
        if (!user) return err(res, 'Not found', 404);
        const roles = Array.isArray(user.roles) ? user.roles : JSON.parse(user.roles as string);
        return ok(res, { id: user.id, name: user.name, email: user.email, roles, profile: user.profile });
      }
      if (req.method === 'PATCH') {
        const { name, email } = req.body ?? {};
        const updated = await prisma.user.update({ where: { id: u.sub }, data: { ...(name && { name }), ...(email && { email }) } });
        return ok(res, { id: updated.id, name: updated.name, email: updated.email });
      }
      if (req.method === 'DELETE') {
        await prisma.simulation.deleteMany({ where: { userId: u.sub } });
        await prisma.user.delete({ where: { id: u.sub } });
        return ok(res, { deleted: true });
      }
    }

    // ── /users/me/password ────────────────────────────────────────────────────
    if (path === '/users/me/password' && req.method === 'PATCH') {
      const u = auth(req, res); if (!u) return;
      const { currentPassword, newPassword } = req.body ?? {};
      if (!currentPassword || !newPassword) return err(res, 'Both passwords required', 400);
      const user = await prisma.user.findUnique({ where: { id: u.sub } });
      if (!user) return err(res, 'Not found', 404);
      if (!await bcrypt.compare(currentPassword, user.passwordHash)) return err(res, 'Current password incorrect', 401);
      await prisma.user.update({ where: { id: u.sub }, data: { passwordHash: await bcrypt.hash(newPassword, await bcrypt.genSalt()) } });
      return ok(res, { updated: true });
    }


    // ── /simulations/public ───────────────────────────────────────────────────
    if (path === '/simulations/public' && req.method === 'GET') {
      const sims = await prisma.simulation.findMany({ where: { isPublic: true }, include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 });
      return ok(res, sims.map((s: any) => ({ ...mapSim(s), authorName: s.user?.name || 'Anonymous' })));
    }

    // ── /simulations (list + create) ──────────────────────────────────────────
    if (path === '/simulations') {
      const u = auth(req, res); if (!u) return;
      if (req.method === 'GET') {
        const page = parseInt(req.query.page as string) || 1, limit = parseInt(req.query.limit as string) || 10;
        const where: any = { userId: u.sub };
        if (req.query.status)   where.status   = req.query.status;
        if (req.query.category) where.category = req.query.category;
        const [sims, total] = await Promise.all([prisma.simulation.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.simulation.count({ where })]);
        return ok(res, { data: sims.map(mapSim), meta: { total, page, limit } });
      }
      if (req.method === 'POST') {
        const { title, category } = req.body ?? {};
        if (!title || !category) return err(res, 'title and category required', 400);
        const sim = await prisma.simulation.create({ data: { id: uuid(), userId: u.sub, title, category, status: 'DRAFT', answers: '{}', generatedQuestions: '[]' } });
        return ok(res, mapSim(sim), 201);
      }
    }

    // ── /simulations/:id/analyze ──────────────────────────────────────────────
    if (p('/simulations/') && path.endsWith('/analyze') && req.method === 'POST') {
      const u = auth(req, res); if (!u) return;
      const id = path.split('/')[2];
      const sim = await prisma.simulation.findUnique({ where: { id } });
      if (!sim) return err(res, 'Not found', 404);
      if (sim.userId !== u.sub) return err(res, 'Forbidden', 403);
      const answers = typeof sim.answers === 'string' ? JSON.parse(sim.answers) : sim.answers;
      const scores = calcScores(answers);
      const updated = await prisma.simulation.update({ where: { id }, data: { status: 'COMPLETED', ...scores } });
      return ok(res, { id: updated.id, status: updated.status, ...scores });
    }

    // ── /simulations/:id/results ──────────────────────────────────────────────
    // Public when the sim is shared (isPublic); otherwise owner-only. This route
    // backs the shareable /simulations/:id/results link, so it must not hard-require auth.
    if (p('/simulations/') && path.endsWith('/results') && req.method === 'GET') {
      const id = path.split('/')[2];
      const sim = await prisma.simulation.findUnique({ where: { id } });
      if (!sim) return err(res, 'Not found', 404);
      if (!sim.isPublic) {
        const u = auth(req, res); if (!u) return;
        if (sim.userId !== u.sub) return err(res, 'Forbidden', 403);
      }
      const report = await prisma.report.findUnique({ where: { simulationId: id } });
      const recs: any = report ? (typeof report.recommendations === 'string' ? JSON.parse(report.recommendations) : report.recommendations) : {};
      const tl: any = report ? (typeof report.timeline === 'string' ? JSON.parse(report.timeline) : report.timeline) : [];
      return ok(res, { id: sim.id, title: sim.title, isPublic: sim.isPublic, finalizedDate: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}), overallRisk: (sim.riskScore??50)<30?'Low':(sim.riskScore??50)<70?'Moderate':'High', riskLabel:'AI Assessed', confidence: sim.confidenceScore??75, bestCase:recs.bestCase, mostLikely:recs.mostLikely, worstCase:recs.worstCase, rightReasons:recs.rightReasons??[], wrongReasons:recs.wrongReasons??[], timeline:tl, alternatives:recs.alternatives??[] });
    }

    // ── /simulations/:id (GET/PATCH/DELETE) ───────────────────────────────────
    if (p('/simulations/') && path.split('/').length === 3) {
      const u = auth(req, res); if (!u) return;
      const id = path.split('/')[2];
      const sim = await prisma.simulation.findUnique({ where: { id } });
      if (!sim) return err(res, 'Not found', 404);
      if (sim.userId !== u.sub) return err(res, 'Forbidden', 403);
      if (req.method === 'GET')    return ok(res, mapSim(sim));
      if (req.method === 'DELETE') { await prisma.simulation.delete({ where: { id } }); return ok(res, { deleted: true }); }
      if (req.method === 'PATCH')  {
        const b = req.body ?? {}, data: any = {};
        if (b.title) data.title = b.title; if (b.category) data.category = b.category;
        if (b.status) data.status = b.status; if (b.isPublic !== undefined) data.isPublic = b.isPublic;
        if (b.answers) { data.answers = JSON.stringify(b.answers); data.status = 'IN_PROGRESS'; }
        return ok(res, mapSim(await prisma.simulation.update({ where: { id }, data })));
      }
    }


    // ── /ai/advisor-insight ───────────────────────────────────────────────────
    if (path === '/ai/advisor-insight' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      return ok(res, { message: 'Market volatility is up 12% this week. Consider reviewing your high-risk equities.', type: 'warning', status: 'Current Analysis Active', checklist: [{ id:'c1',label:'Review AI recommendation above',done:false },{ id:'c2',label:'Run a new simulation',done:false }] });
    }

    // ── /ai/generate-topic ────────────────────────────────────────────────────
    if (path === '/ai/generate-topic' && req.method === 'POST') {
      const u = auth(req, res); if (!u) return;
      const message = req.body?.message || '';
      if (!message) return ok(res, { title: 'New Simulation', category: 'PERSONAL' });
      try {
        const r = await aiChat([{ role:'user', content:`Based on this message, give a 2-5 word simulation title and one category from [CAREER,FINANCIAL,PERSONAL,BUSINESS,HEALTH,EDUCATION]. Return ONLY JSON: {"title":"...","category":"..."}. Message: "${message}"` }]);
        const d = await r.json();
        const parsed = JSON.parse(d.choices?.[0]?.message?.content?.replace(/```json|```/g,'').trim());
        const cats = ['CAREER','FINANCIAL','PERSONAL','BUSINESS','HEALTH','EDUCATION'];
        return ok(res, { title: parsed.title || 'New Simulation', category: cats.includes(parsed.category) ? parsed.category : detectCategory(message) });
      } catch { return ok(res, { title: 'New Simulation', category: detectCategory(message) }); }
    }

    // ── /ai/simulations/:id/chat (SSE) ────────────────────────────────────────
    if (p('/ai/simulations/') && path.endsWith('/chat') && req.method === 'POST') {
      const u = auth(req, res); if (!u) return;
      const { message, messages } = req.body ?? {};
      const sysMsg = { role:'system', content: SYSTEM };
      const payload = Array.isArray(messages) && messages.length > 0
        ? [sysMsg, ...messages.map((m:any) => ({ role: m.role==='assistant'?'assistant':'user', content: String(m.content) }))]
        : [sysMsg, { role:'user', content: message || 'Start the simulation. Ask your first question.' }];

      res.setHeader('Content-Type','text/event-stream');
      res.setHeader('Cache-Control','no-cache,no-transform');
      res.setHeader('Connection','keep-alive');
      res.setHeader('X-Accel-Buffering','no');

      const send = (type: string, value: any) => res.write(`data: ${JSON.stringify({type,value})}\n\n`);
      try {
        const gr = await aiChat(payload, true);
        if (!gr.ok) { send('error', `AI error: ${gr.status}`); res.end(); return; }
        const reader = (gr.body as any).getReader(), dec = new TextDecoder();
        let buf = '';
        while(true) {
          const {done,value} = await reader.read(); if(done) break;
          buf += dec.decode(value,{stream:true});
          const lines = buf.split('\n'); buf = lines.pop()??'';
          for(const line of lines) {
            if(!line.startsWith('data: ')) continue;
            const d = line.slice(6); if(d==='[DONE]') break;
            try { const c = JSON.parse(d).choices?.[0]?.delta?.content; if(c) send('token',c); } catch{}
          }
        }
        const convoText = [message, ...(Array.isArray(messages) ? messages.map((m:any)=>m.content) : [])].filter(Boolean).join(' ');
        send('suggestions', QUICK_ANSWERS[detectCategory(convoText)] ?? QUICK_ANSWERS.PERSONAL);
        send('insight',{label:'LIVE PATH INSIGHT',message:'Your responses are shaping the probability model.'});
        send('done','');
      } catch(e:any) { send('error', e.message); }
      res.end(); return;
    }


    // ── /analytics/dashboard-stats ────────────────────────────────────────────
    if (path === '/analytics/dashboard-stats' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const h = (min:number,max:number,n:number) => Array.from({length:n},()=>+(min+Math.random()*(max-min)).toFixed(1));
      return ok(res, { stabilityIndex:{value:+(75+Math.random()*20).toFixed(1),unit:'%',trend:'up',history:h(70,95,20)}, riskVector:{value:+(8+Math.random()*15).toFixed(1),unit:'pts',label:'Low',trend:'down',history:h(5,25,20)}, projectedCapital:{value:+(1.2+Math.random()*0.8).toFixed(2),unit:'M',prefix:'$',history:h(1.0,2.0,20)}, pathAlpha:{value:Math.floor(20+Math.random()*30),label:'A/B',trend:'up'} });
    }

    // ── /analytics/market-correlation ────────────────────────────────────────
    if (path === '/analytics/market-correlation' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const c = (b:number,v:number) => +( b+(Math.random()-.5)*v ).toFixed(2);
      return ok(res, [
        {id:'m1',label:'S&P 500 Index',changePercent:c(1.24,1.6),direction:'up'},
        {id:'m2',label:'Interest Rate (Sim)',changePercent:c(-5.25,2.4),direction:'down'},
        {id:'m3',label:'NASDAQ Composite',changePercent:c(0.87,3.0),direction:'up'},
      ]);
    }

    // ── /analytics/system-meta ───────────────────────────────────────────────
    if (path === '/analytics/system-meta' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      return ok(res, { simulationUptime:+(99.95+Math.random()*0.04).toFixed(2), lastRecalc:`${Math.floor(Math.random()*120)+1}s ago` });
    }

    // ── /admin/users (ADMIN only) ────────────────────────────────────────────
    if (path === '/admin/users' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const roles = Array.isArray(u.roles) ? u.roles : [];
      if (!roles.includes('ADMIN')) return err(res, 'Forbidden — ADMIN role required', 403);
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, take: 100,
        include: { _count: { select: { simulations: true } } },
      });
      return ok(res, users.map((usr: any) => {
        const r = Array.isArray(usr.roles) ? usr.roles : JSON.parse(usr.roles || '[]');
        return {
          id: usr.id, email: usr.email, firstName: usr.name, lastName: '',
          role: r.includes('ADMIN') ? 'ADMIN' : r.includes('PREMIUM') ? 'PREMIUM' : 'USER',
          _count: usr._count, createdAt: usr.createdAt,
        };
      }));
    }

    // ── /reports/generate/:simulationId ──────────────────────────────────────
    if (p('/reports/generate/') && req.method === 'POST') {
      const u = auth(req, res); if (!u) return;
      const simId = path.split('/')[3];
      const sim = await prisma.simulation.findUnique({ where: { id: simId } });
      if (!sim) return err(res, 'Not found', 404);
      if (sim.userId !== u.sub) return err(res, 'Forbidden', 403);
      const answers = typeof sim.answers === 'string' ? JSON.parse(sim.answers) : sim.answers;
      let aiData: any;
      try {
        const r = await aiChat([{ role:'user', content:`You are an expert AI advisor. Simulation: "${sim.title}" (${sim.category}). Answers: ${JSON.stringify(answers)}. Return ONLY raw JSON, no prose, with EXACTLY these keys and shapes: bestCase/mostLikely/worstCase are objects {label,probability(number),title(string),description(string),salaryDelta(string),satisfaction(string)}; rightReasons and wrongReasons are arrays of 3 plain strings (NOT objects); timeline is an array of {id,label,sublabel} (all strings); alternatives is an array of {id,title,subtitle,score(number 0-100)}.` }]);
        const d = await r.json();
        aiData = JSON.parse(d.choices?.[0]?.message?.content?.replace(/```json|```/g,'').trim());
      } catch {
        aiData = { bestCase:{label:'BEST CASE',probability:22,title:'Optimistic',description:'Things go well.',salaryDelta:'+$20k',satisfaction:'9/10'}, mostLikely:{label:'MOST LIKELY',probability:63,title:'Expected',description:'Realistic.',salaryDelta:'+$10k',satisfaction:'7/10'}, worstCase:{label:'WORST CASE',probability:15,title:'Pessimistic',description:'Challenges.',salaryDelta:'$0k',satisfaction:'4/10'}, rightReasons:['Good timing','Strong skills'], wrongReasons:['Execution risk','Competition'], timeline:[{id:'t1',label:'TODAY',sublabel:'Decision'},{id:'t2',label:'YEAR 1',sublabel:'Action'}], alternatives:[{id:'alt1',title:'Stay Current',subtitle:'Safe',score:55}] };
      }
      const scores = calcScores(answers);
      await prisma.report.upsert({ where:{simulationId:simId}, create:{id:uuid(),simulationId:simId,userId:u.sub,summary:aiData.mostLikely?.description||'Report',chartData:'[]',timeline:JSON.stringify(aiData.timeline||[]),scores:JSON.stringify(scores),recommendations:JSON.stringify(aiData)}, update:{summary:aiData.mostLikely?.description||'Report',timeline:JSON.stringify(aiData.timeline||[]),scores:JSON.stringify(scores),recommendations:JSON.stringify(aiData)} });
      await prisma.simulation.update({ where:{id:simId}, data:{status:'COMPLETED',...scores} });
      return ok(res, { generated: true, simulationId: simId });
    }

    // ── /reports/simulations/:id ──────────────────────────────────────────────
    if (p('/reports/simulations/') && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const simId = path.split('/')[3];
      const report = await prisma.report.findUnique({ where: { simulationId: simId } });
      if (!report) return err(res, 'Report not found', 404);
      // Ownership check: only the report's owner may read it, unless the underlying
      // simulation is shared publicly. Without this any authenticated user could
      // read anyone's report by guessing/knowing a simulation id (IDOR).
      if (report.userId !== u.sub) {
        const sim = await prisma.simulation.findUnique({ where: { id: simId }, select: { isPublic: true } });
        if (!sim?.isPublic) return err(res, 'Forbidden', 403);
      }
      return ok(res, { id:report.id, simulationId:report.simulationId, summary:report.summary, timeline: typeof report.timeline==='string'?JSON.parse(report.timeline):report.timeline, recommendations: typeof report.recommendations==='string'?JSON.parse(report.recommendations):report.recommendations, scores: typeof report.scores==='string'?JSON.parse(report.scores):report.scores, createdAt:report.createdAt, updatedAt:report.updatedAt });
    }

    // ── 404 fallback ──────────────────────────────────────────────────────────
    return err(res, `Route not found: ${req.method} ${path}`, 404);

  } catch (e: any) {
    // Log the real error server-side; never leak internal messages/stack to clients.
    console.error('API error:', e);
    return err(res, 'Internal server error', 500);
  }
}
