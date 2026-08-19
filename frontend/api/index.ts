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
// Every derived field here stays null until the underlying score exists. An
// unscored draft has no risk level, no confidence and no grade — coercing the
// absent score to 0 used to make the dashboard state "Low risk · 0% · SAFE PATH"
// about a decision nothing had analysed yet. The UI already renders '—' for null.
function riskBand(risk: number | null) {
  if (risk === null) return null;
  return risk < 30 ? 'Low' : risk < 70 ? 'Med' : 'High';
}

function decisionGrade(score: number | null) {
  if (score === null) return null;
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// The tag summarises what we actually know, so a finished high-risk decision is
// never labelled a safe path.
function statusTag(status: string, risk: number | null) {
  if (status !== 'COMPLETED') return 'PENDING ACTION';
  if (risk === null) return 'COMPLETED';
  if (risk < 30) return 'SAFE PATH';
  if (risk < 70) return 'PROCEED WITH CARE';
  return 'HIGH RISK';
}

function mapSim(s: any) {
  const risk = s.riskScore ?? null;
  const decision = s.decisionScore ?? null;
  return {
    id: s.id, title: s.title, category: s.category, status: s.status, isPublic: s.isPublic,
    riskLevel: riskBand(risk), riskPercent: risk,
    confidenceScore: s.confidenceScore ?? null, decisionScore: decision,
    riskScore: risk, answers: s.answers, generatedQuestions: s.generatedQuestions,
    decisionGrade: decisionGrade(decision),
    statusTag: statusTag(s.status, risk),
    updatedAt: s.updatedAt,
  };
}

// ── Admin analytics helpers ───────────────────────────────────────────────────
// UTC midnight `windowDays - 1` days back, so the window ends with a full
// present-day bucket. Deliberately UTC, not local: the day keys below are cut
// from toISOString(), and mixing local midnight with UTC keys would silently
// drop today's rows into a bucket the series never seeded.
function dayWindowStart(windowDays: number) {
  const d = new Date(Date.now() - (windowDays - 1) * 864e5);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// Every day in the window is seeded, so a quiet day plots as an honest 0 instead
// of vanishing and letting the chart draw a straight line between two distant
// dates. Labels are MM-DD for the axis.
function bucketByDay(dates: (Date | string)[], since: Date, windowDays: number) {
  const days = new Map<string, number>();
  for (let i = 0; i < windowDays; i++) {
    days.set(new Date(since.getTime() + i * 864e5).toISOString().slice(0, 10), 0);
  }
  for (const raw of dates) {
    const k = new Date(raw).toISOString().slice(0, 10);
    if (days.has(k)) days.set(k, days.get(k)! + 1);
  }
  return [...days].map(([date, count]) => ({ date: date.slice(5), count }));
}

// `roles` is a Json column; some rows hold it as a JSON *string* rather than an
// array, so a plain `.includes` on the raw value would quietly count zero.
function countRole(rows: { roles: any }[], role: string) {
  return rows.filter(row => {
    let r: any = row.roles;
    if (!Array.isArray(r)) { try { r = JSON.parse(r || '[]'); } catch { r = []; } }
    return Array.isArray(r) && r.includes(role);
  }).length;
}
// ── Simulation answers ────────────────────────────────────────────────────────
// `answers` holds the real conversation so the report can be grounded on it:
//   { transcript: [{role,content}, …ordered AI questions + user answers],
//     qa: { q0: '<user answer>', … } }
// Older rows hold only the flat `{ q0: '…' }` map (the AI's questions were never
// stored), so both shapes are accepted and normalized to one here.
function normalizeAnswers(raw: any): { transcript: { role: string; content: string }[]; qa: Record<string, string> } {
  let a = raw;
  if (typeof a === 'string') { try { a = JSON.parse(a); } catch { a = {}; } }
  if (!a || typeof a !== 'object' || Array.isArray(a)) return { transcript: [], qa: {} };

  if (Array.isArray(a.transcript)) {
    const transcript = a.transcript
      .filter((t: any) => t && typeof t.content === 'string' && t.content.trim())
      .map((t: any) => ({ role: t.role === 'assistant' ? 'assistant' : 'user', content: String(t.content).trim() }));
    const qa: Record<string, string> = {};
    if (a.qa && typeof a.qa === 'object') {
      for (const [k, v] of Object.entries(a.qa)) if (typeof v === 'string' && v.trim()) qa[k] = v.trim();
    }
    return { transcript, qa };
  }

  // Legacy flat map — reconstruct a user-only transcript from it.
  const qa: Record<string, string> = {};
  for (const [k, v] of Object.entries(a)) if (typeof v === 'string' && v.trim()) qa[k] = v.trim();
  return { transcript: Object.values(qa).map(content => ({ role: 'user', content })), qa };
}

// ── Real-world validation ─────────────────────────────────────────────────────
// The model's JSON is untrusted input: probabilities drift off 100, salary
// deltas come back in mixed currencies or with the sign dropped, satisfaction
// escapes 0-10. This report is presented to the user as decision evidence, so
// every number is bounded and normalized here before it is stored — otherwise
// the UI renders whatever the LLM happened to emit.
const FX_TO_USD: Record<string, number> = {
  '$': 1, us$: 1, usd: 1, '€': 1.08, eur: 1.08, '£': 1.27, gbp: 1.27,
  '₹': 0.012, inr: 0.012, 'c$': 0.73, cad: 0.73, 'a$': 0.66, aud: 0.66, '¥': 0.0064, jpy: 0.0064,
};
const MAX_SALARY_DELTA = 2_000_000;   // annual comp swing beyond this is not plausible

function parseMoney(raw: any): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase().replace(/−/g, '-');
  const m = s.match(/(-|\+)?\s*([a-z$€£₹¥]{0,3})\s*(-|\+)?\s*([\d,]+(?:\.\d+)?)\s*(k|m|thousand|million)?/);
  if (!m) return null;
  const num = parseFloat((m[4] || '').replace(/,/g, ''));
  if (!Number.isFinite(num)) return null;
  const sign = (m[1] === '-' || m[3] === '-') ? -1 : 1;
  const unit  = m[5] === 'k' || m[5] === 'thousand' ? 1e3 : (m[5] === 'm' || m[5] === 'million' ? 1e6 : 1);
  const fx    = FX_TO_USD[(m[2] || '$').replace(/[^a-z$€£₹¥]/g, '')] ?? 1;
  return sign * num * unit * fx;
}
function fmtUSD(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}k`;
  return `${sign}$${Math.round(a)}`;
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const str = (v: any, fallback = '') => (typeof v === 'string' && v.trim() ? v.trim() : fallback);

// A 0-100 figure, or null when the model gave us nothing. `Number(null)` is 0 and
// `Number(undefined) || 0` is 0, so absent values have to be rejected *before* the
// finite check or they arrive downstream as a confident-looking zero.
const pct = (v: any): number | null =>
  (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))
    ? null
    : clamp(Math.round(Number(v)), 0, 100));

function validateScenario(s: any, label: string, fallbackTitle: string) {
  const money = parseMoney(s?.salaryDelta);
  const satNum = parseMoney(String(s?.satisfaction ?? '').split('/')[0]);
  return {
    label,
    // Absence stays absent: an unforecast scenario renders "—", not "0% PROB.".
    probability: pct(s?.probability),
    title: str(s?.title, fallbackTitle),
    description: str(s?.description, 'No description provided.'),
    // Sign is meaningful (a pay cut must stay negative) and is preserved here.
    salaryDelta: money === null ? 'N/A' : fmtUSD(clamp(money, -MAX_SALARY_DELTA, MAX_SALARY_DELTA)),
    satisfaction: satNum === null ? 'N/A' : `${clamp(Math.round(satNum), 1, 10)}/10`,
  };
}

function validateReport(raw: any) {
  const d = raw && typeof raw === 'object' ? raw : {};
  let best   = validateScenario(d.bestCase,   'BEST CASE',   'Optimistic');
  let likely = validateScenario(d.mostLikely, 'MOST LIKELY', 'Expected');
  let worst  = validateScenario(d.worstCase,  'WORST CASE',  'Pessimistic');

  // A best case that pays less than the worst case is incoherent. Swap the whole
  // objects so each description keeps travelling with its own numbers, then
  // restore the canonical labels the UI renders.
  const bd = parseMoney(best.salaryDelta), wd = parseMoney(worst.salaryDelta);
  if (bd !== null && wd !== null && bd < wd) {
    const t = best; best = { ...worst, label: 'BEST CASE' }; worst = { ...t, label: 'WORST CASE' };
  }

  // The three scenarios are exhaustive, so their probabilities must sum to 100 —
  // but that premise only holds when the model actually forecast all three. With
  // one missing there is no distribution to renormalize against, and inventing a
  // default spread would persist a projection this user never received. So a
  // partial forecast is left exactly as it came in, and the UI shows "—" for the
  // scenario that has no figure.
  if (best.probability !== null && likely.probability !== null && worst.probability !== null) {
    const total = best.probability + likely.probability + worst.probability;
    if (total > 0 && Math.abs(total - 100) > 1) {
      best.probability   = Math.round((best.probability   / total) * 100);
      worst.probability  = Math.round((worst.probability  / total) * 100);
      likely.probability = clamp(100 - best.probability - worst.probability, 0, 100);
    }
    // total === 0 is left alone: three explicit zeros are a degenerate forecast,
    // and calcScores already declines to score it rather than guessing.
  }

  const reasons = (v: any, pad: string) => {
    const list = (Array.isArray(v) ? v : [])
      .map((x: any) => (typeof x === 'string' ? x.trim() : str(x?.title ?? x?.label ?? x?.text)))
      .filter(Boolean).slice(0, 3);
    while (list.length < 3) list.push(pad);
    return list;
  };

  return {
    bestCase: best, mostLikely: likely, worstCase: worst,
    rightReasons: reasons(d.rightReasons, 'Not enough information to assess.'),
    wrongReasons: reasons(d.wrongReasons, 'Not enough information to assess.'),
    timeline: (Array.isArray(d.timeline) ? d.timeline : []).slice(0, 8).map((t: any, i: number) => ({
      id: str(t?.id, `t${i + 1}`), label: str(t?.label, `STEP ${i + 1}`), sublabel: str(t?.sublabel, ''),
    })),
    alternatives: (Array.isArray(d.alternatives) ? d.alternatives : []).slice(0, 6).map((a: any, i: number) => ({
      id: str(a?.id, `alt${i + 1}`), title: str(a?.title, `Alternative ${i + 1}`),
      // An unrated alternative is not a zero-rated one — 0 would paint it red as
      // though the model had actively judged it worthless.
      subtitle: str(a?.subtitle, ''), score: pct(a?.score),
    })),
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────────
// Scores follow what the model actually projected and what the user actually
// said — never the number of answers, which says nothing about the decision.
// Before a report exists there is no projection to score, so all three come
// back null and the UI shows "Not assessed" rather than a confident-looking
// number derived from answer volume.
function calcScores(answers: any, report?: any): { riskScore: number | null; confidenceScore: number | null; decisionScore: number | null } {
  const { transcript, qa } = normalizeAnswers(answers);
  const userTurns = transcript.filter(t => t.role === 'user');
  const answered  = Math.max(userTurns.length, Object.keys(qa).length);
  const words     = userTurns.reduce((n, t) => n + t.content.split(/\s+/).filter(Boolean).length, 0);

  // How much evidence we actually hold: breadth of answers plus their depth.
  const evidence = 0.6 * Math.min(1, answered / 5) + 0.4 * Math.min(1, words / 120);

  // Absent probabilities are rejected by `pct`, not coerced. This guard is no
  // longer dead code on the report path: validateReport now preserves a missing
  // probability as null instead of inventing a 20/60/20 spread, so a partial
  // forecast reaches here and correctly declines to produce any score at all.
  const pb = pct(report?.bestCase?.probability), pl = pct(report?.mostLikely?.probability), pw = pct(report?.worstCase?.probability);
  if (pb === null || pl === null || pw === null || pb + pl + pw <= 0) {
    return { riskScore: null, confidenceScore: null, decisionScore: null };
  }
  const wsum = pb + pl + pw;

  // Probability-weighted satisfaction (1-10) and expected annual USD delta —
  // the two things the model actually projected about the outcome. Weights are
  // renormalized over only the scenarios that carry a figure.
  const sat1 = (s: any) => parseMoney(String(s?.satisfaction ?? '').split('/')[0]);
  let satAcc = 0, satW = 0, evAcc = 0, evW = 0;
  for (const [prob, s] of [[pb, report.bestCase], [pl, report.mostLikely], [pw, report.worstCase]] as [number, any][]) {
    const sat = sat1(s);
    if (sat !== null) { satAcc += prob * clamp(sat, 1, 10); satW += prob; }
    const d = parseMoney(s?.salaryDelta);
    if (d !== null) { evAcc += prob * d; evW += prob; }
  }
  const sat = satW > 0 ? satAcc / satW : null;   // 1-10
  const ev  = evW  > 0 ? evAcc  / evW  : null;   // annual USD

  // Risk: the probability mass sitting on bad outcomes. The middle scenario
  // counts fully only to the extent it is itself a bad outcome.
  const likelyBad = (parseMoney(report.mostLikely?.salaryDelta) ?? 0) < 0 || (sat1(report.mostLikely) ?? 6) < 6;
  const risk = clamp(Math.round(100 * (pw + (likelyBad ? 0.6 : 0.25) * pl) / wsum), 5, 95);

  // Confidence: how much we know, and how concentrated the outcome distribution
  // is — a 34/33/33 spread is a coin toss however much the user said.
  const conf = clamp(Math.round(100 * (0.55 * evidence + 0.45 * (Math.max(pb, pl, pw) / wsum))), 20, 95);

  // Decision: how good the projected outcome is for this user, not merely how
  // risky it is. Centred on 50 = "no signal either way" and pushed either way by
  // the weighted satisfaction and expected pay change, then scaled by confidence
  // so a thin interview cannot produce a strong verdict in either direction.
  // The old formula (100 - risk/2 + …) had an effective floor near 52, which made
  // a clearly bad decision unable to read as anything worse than "proceed with care".
  const satSignal   = sat === null ? 0 : clamp((sat - 5.5) / 4.5, -1, 1);
  const moneySignal = ev  === null ? 0 : clamp(ev / 50_000, -1, 1);
  const outlook = sat === null && ev === null
    ? clamp((50 - risk) / 45, -1, 1)                     // nothing priced → risk alone
    : 0.65 * satSignal + 0.35 * moneySignal;
  const decision = clamp(Math.round(50 + 50 * outlook * (0.5 + 0.5 * conf / 100)), 0, 100);

  return { riskScore: risk, confidenceScore: conf, decisionScore: decision };
}

// Pick which copy of the risk/decision/confidence triple to report.
//
// `reports.scores` is where the triple is computed; the three columns on
// `simulations` are a denormalized copy kept so lists can sort and filter without
// joining `reports`. Two stores means they can disagree, and both directions
// really happen: rows written before commit dbdc07d have a scored report and NULL
// columns, while /analyze recomputes the columns from the user's current answers.
//
// The choice is made once for the whole triple rather than per field. They are one
// projection, and they are read against each other — the verdict comes from
// decision while the risk band is printed beside it — so pairing a stale column
// with a fresh report figure would describe a forecast that never existed. Taking
// the columns only when all three are present means a row torn mid-write falls
// back to the report as a coherent whole instead of being patched field by field.
function resolveScores(sim: any, stored: any): { riskScore: number | null; confidenceScore: number | null; decisionScore: number | null } {
  const complete = sim?.riskScore !== null && sim?.riskScore !== undefined
    && sim?.decisionScore !== null && sim?.decisionScore !== undefined
    && sim?.confidenceScore !== null && sim?.confidenceScore !== undefined;
  const src = complete ? sim : stored;
  return {
    riskScore:       pct(src?.riskScore),
    confidenceScore: pct(src?.confidenceScore),
    decisionScore:   pct(src?.decisionScore),
  };
}

// ── Notifications ─────────────────────────────────────────────────────────────
// Every item is DERIVED from rows the caller owns, so each one is a checkable
// statement about their own work. The bell used to render four hardcoded items to
// every account — "Series C Equity analysis is ready to review", "Primary Residence
// Pivot needs your input" — which a user who registered a minute ago and owned
// nothing still saw, complete with a permanent "2 unread" badge and invented
// "2m ago" timestamps. Nothing was ever fetched.
//
// Deriving instead of reading a notifications table is deliberate: there is no way
// for a derived item to outlive, contradict, or precede the simulation it describes.
//
// The function is pure and clock-free — no Date.now() — so the same rows always
// produce the same payload, and the relative time ("2m ago") is formatted on the
// client from the ISO stamp. That also keeps it directly testable.
//
// `at` is the timestamp the item is ABOUT (the report's, when there is one), not
// when it was assembled, and it is baked into the id: regenerating a report is a
// genuinely new event, so it must not silently inherit the read state of the one
// the user already dismissed. Read state is per-id and lives on the client.
function buildNotifications(sims: any[]): any[] {
  const iso = (v: any) => {
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
    if (typeof v === 'string' && v) { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d.toISOString(); }
    return null;
  };
  const items = (Array.isArray(sims) ? sims : []).map((s: any) => {
    if (!s?.id) return null;
    // A simulation is unique per report (Report.simulationId is @unique), so at most
    // one row comes back; take its time so "ready" means when the report last changed.
    const reportAt = iso(s?.reports?.[0]?.updatedAt);
    const at = reportAt ?? iso(s?.updatedAt);
    if (!at) return null;  // no usable timestamp — say nothing rather than guess one
    const title = typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'Untitled simulation';
    return reportAt
      ? { id: `report:${s.id}:${at}`, type: 'success', title: 'Report ready',
          body: `${title} — your analysis is ready to review.`, at, href: `/simulations/${s.id}/results` }
      : { id: `draft:${s.id}:${at}`, type: 'warning', title: 'Simulation unfinished',
          body: `${title} has no report yet — open it to pick up where you left off.`, at, href: `/simulations/${s.id}/results` };
  }).filter(Boolean) as any[];
  // Newest first and capped, so the drawer is recent activity rather than the
  // user's entire history restated back to them.
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return items.slice(0, 12);
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
        // Both are clamped: an unbounded `limit` let one request ask for every
        // row the caller owns, and `page=-1` produced a negative Prisma `skip`,
        // which throws a 500 instead of returning an empty page.
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
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
      // Scores come from the report's projection, so re-analyzing a simulation
      // that already has one recomputes from it rather than blanking it out.
      const existing = await prisma.report.findUnique({ where: { simulationId: id } });
      let recs: any = null;
      if (existing) {
        try { recs = typeof existing.recommendations === 'string' ? JSON.parse(existing.recommendations) : existing.recommendations; } catch { recs = null; }
      }
      const scores = calcScores(answers, recs);
      // Nulls mean "no report yet" — don't write them over real scores.
      const data: any = { status: 'COMPLETED' };
      if (scores.decisionScore !== null) Object.assign(data, scores);
      const updated = await prisma.simulation.update({ where: { id }, data });
      // Keep both stores in lockstep. Re-analyzing recomputes from the same
      // projection but with the user's current answers, so the evidence term (and
      // with it confidence) can move; writing only the simulation columns would
      // leave reports.scores behind, and the two disagree from then on — the
      // compare page reads the report first while the results page prefers the
      // columns, so the same simulation would show two different figures.
      if (existing && scores.decisionScore !== null) {
        await prisma.report.update({ where: { simulationId: id }, data: { scores: JSON.stringify(scores) } });
      }
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
      let stored: any = {};
      if (report) { try { stored = typeof report.scores === 'string' ? JSON.parse(report.scores) : (report.scores ?? {}); } catch { stored = {}; } }

      // Every field below is either stored data or derived from it. Nothing is
      // invented: no report means no verdict, no confidence and no date, so the
      // UI can render an honest empty state instead of a confident-looking one.
      //
      // Which of the two stores the scores come from — and why it is decided for
      // the triple as a whole — is documented on resolveScores.
      const { riskScore: risk, decisionScore: dec, confidenceScore: conf } = resolveScores(sim, stored);
      const verdict = dec === null ? null
        : dec >= 75 ? 'RECOMMENDED'
        : dec >= 60 ? 'PROCEED WITH CARE'
        : dec >= 45 ? 'MIXED OUTLOOK'
        : 'NOT RECOMMENDED';

      return ok(res, {
        id: sim.id, title: sim.title, isPublic: sim.isPublic,
        hasReport: !!report,
        // When the report was actually finalized — not "now" on every page load.
        finalizedDate: report
          ? new Date(report.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null,
        overallRisk: risk === null ? null : risk < 30 ? 'Low' : risk < 70 ? 'Moderate' : 'High',
        riskLabel: risk === null ? 'Not assessed' : `Risk score ${risk}/100`,
        riskScore: risk, decisionScore: dec, verdict,
        confidence: conf,
        bestCase: recs.bestCase, mostLikely: recs.mostLikely, worstCase: recs.worstCase,
        rightReasons: recs.rightReasons ?? [], wrongReasons: recs.wrongReasons ?? [],
        timeline: tl, alternatives: recs.alternatives ?? [],
      });
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
      } catch(e:any) {
        // Same rule as the outer handler: log the real error, tell the browser
        // nothing about our internals. This used to stream e.message straight to
        // the client, so a driver or upstream failure leaked its text into the chat.
        console.error('API error (chat stream):', e);
        send('error', 'The AI service is unavailable right now. Please try again.');
      }
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

    // ── /admin/analytics (ADMIN only) ────────────────────────────────────────
    // Platform-wide aggregates. The admin dashboard used to derive these from
    // GET /simulations, which is scoped to `userId: u.sub` — so "Total
    // Simulations" described only the admin's own rows, while totalReports and
    // premiumUsers were never produced at all (their cards rendered a permanent
    // '—' and the conversion sub-label rendered "NaN% conversion").
    if (path === '/admin/analytics' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const roles = Array.isArray(u.roles) ? u.roles : [];
      if (!roles.includes('ADMIN')) return err(res, 'Forbidden — ADMIN role required', 403);

      const WINDOW_DAYS = 14;
      const since = dayWindowStart(WINDOW_DAYS);

      const [totalUsers, totalSimulations, completedSimulations, totalReports, riskAgg, byCategory, recent, roleRows] =
        await Promise.all([
          prisma.user.count(),
          prisma.simulation.count(),
          prisma.simulation.count({ where: { status: 'COMPLETED' } }),
          prisma.report.count(),
          // SQL AVG skips NULLs, which is exactly the intent: average the
          // simulations that were actually scored rather than counting every
          // unscored draft as a zero and dragging the mean toward 0. _count on
          // the same column returns that denominator, so the card can say how
          // many runs the average actually describes instead of implying all of
          // them — a mean over 4 of 39 rows is not a platform-wide figure.
          prisma.simulation.aggregate({ _avg: { riskScore: true }, _count: { riskScore: true } }),
          prisma.simulation.groupBy({ by: ['category'], _count: { _all: true } }),
          prisma.simulation.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
          // `roles` is a Json column that some rows hold as a JSON *string*
          // (hence the defensive parse in /admin/users), so PREMIUM is counted
          // here instead of with a jsonb containment query that would miss them.
          prisma.user.findMany({ select: { roles: true } }),
        ]);

      const avgRisk = riskAgg._avg?.riskScore;
      return ok(res, {
        totalUsers, totalSimulations, completedSimulations, totalReports,
        premiumUsers: countRole(roleRows, 'PREMIUM'),
        // null, not 0, when nothing has been scored yet.
        averageRisk: avgRisk === null || avgRisk === undefined ? null : Math.round(Number(avgRisk)),
        // The AVG denominator, so the dashboard can qualify the figure.
        scoredSimulations: riskAgg._count?.riskScore ?? 0,
        simulationsByDay: bucketByDay(recent.map((s: any) => s.createdAt), since, WINDOW_DAYS),
        simulationsByCategory: byCategory
          .map((c: any) => ({ category: c.category, count: c._count?._all ?? c._count ?? 0 }))
          .sort((a: any, b: any) => b.count - a.count),
      });
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
      const { transcript } = normalizeAnswers(sim.answers);

      // No conversation, no report. Generating from just the title + category is
      // exactly the ungrounded output this route exists to avoid.
      if (transcript.length === 0) {
        return err(res, 'This simulation has no recorded conversation yet. Answer the questions first, then generate the report.', 400);
      }

      // Feed the real exchange, verbatim and in order, so the projection is tied
      // to what the user actually said rather than to the 2-5 word title.
      const transcriptText = transcript
        .map(t => `${t.role === 'assistant' ? 'ADVISOR' : 'USER'}: ${t.content}`)
        .join('\n');

      const REPORT_SYSTEM = `You are FuturePath AI's report engine. You are given the full transcript of a decision-simulation interview. Ground every field of your output in what the USER actually said — quote their specifics (numbers, roles, cities, constraints, timelines) rather than generic advice. If the transcript does not support a claim, say so plainly instead of inventing detail.

Hard rules:
- bestCase/mostLikely/worstCase probabilities are percentages that MUST sum to exactly 100.
- salaryDelta is an annual change in USD relative to today, signed: "+$18k" for a gain, "-$12k" for a cut, "$0" for no change. Never drop a minus sign.
- satisfaction is "N/10" with N an integer 1-10.
- Be realistic, not optimistic: a genuinely risky decision must show a worstCase probability that reflects it.
- Return ONLY raw JSON. No prose, no markdown fences.`;

      let aiData: any;
      const r = await aiChat([
        { role: 'system', content: REPORT_SYSTEM },
        { role: 'user', content: `Simulation: "${sim.title}" (${sim.category}).

FULL INTERVIEW TRANSCRIPT:
${transcriptText}

Return ONLY raw JSON with EXACTLY these keys and shapes: bestCase/mostLikely/worstCase are objects {label,probability(number),title(string),description(string),salaryDelta(string),satisfaction(string)}; rightReasons and wrongReasons are arrays of 3 plain strings (NOT objects) drawn from the transcript; timeline is an array of {id,label,sublabel} (all strings); alternatives is an array of {id,title,subtitle,score(number 0-100)}.` },
      ]);
      try {
        const d = await r.json();
        aiData = JSON.parse(d.choices?.[0]?.message?.content?.replace(/```json|```/g, '').trim());
      } catch {
        // Never persist invented numbers as if they were this user's projection —
        // an honest failure the user can retry beats a plausible fabrication.
        return err(res, 'The AI could not produce a valid report from this conversation. Please try again.', 503);
      }

      // Bound and normalize every number before it is stored or shown.
      aiData = validateReport(aiData);
      const scores = calcScores(sim.answers, aiData);
      await prisma.report.upsert({ where:{simulationId:simId}, create:{id:uuid(),simulationId:simId,userId:u.sub,summary:aiData.mostLikely?.description||'Report',chartData:'[]',timeline:JSON.stringify(aiData.timeline||[]),scores:JSON.stringify(scores),recommendations:JSON.stringify(aiData)}, update:{summary:aiData.mostLikely?.description||'Report',timeline:JSON.stringify(aiData.timeline||[]),scores:JSON.stringify(scores),recommendations:JSON.stringify(aiData)} });
      // Same rule as /analyze: nulls mean "not scoreable", not "score of zero",
      // so they must never be written over columns that already hold real
      // figures. Reachable now that a partial forecast yields null scores.
      const simData: any = { status: 'COMPLETED' };
      if (scores.decisionScore !== null) Object.assign(simData, scores);
      await prisma.simulation.update({ where:{id:simId}, data: simData });
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

    // ── /notifications ────────────────────────────────────────────────────────
    // Derived from the caller's own simulations and their reports — see
    // buildNotifications for why there is no notifications table behind this.
    if (path === '/notifications' && req.method === 'GET') {
      const u = auth(req, res); if (!u) return;
      const sims = await prisma.simulation.findMany({
        where: { userId: u.sub },
        orderBy: { updatedAt: 'desc' },
        take: 25,
        select: {
          id: true, title: true, updatedAt: true,
          reports: { select: { updatedAt: true }, take: 1 },
        },
      });
      const items = buildNotifications(sims);
      return ok(res, { data: items, meta: { total: items.length } });
    }

    // ── 404 fallback ──────────────────────────────────────────────────────────
    return err(res, `Route not found: ${req.method} ${path}`, 404);

  } catch (e: any) {
    // Log the real error server-side; never leak internal messages/stack to clients.
    console.error('API error:', e);
    return err(res, 'Internal server error', 500);
  }
}
