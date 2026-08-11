# 🚀 FuturePath AI

An AI-driven decision-simulation app. Users describe a decision, chat with an AI
advisor that asks clarifying questions, and receive a scored report (decision /
risk / confidence) with charts, a timeline, and recommendations.

The whole thing deploys to **Vercel** as one project: a **Vite + React** SPA plus a
**single serverless function** that serves the entire API.

---

## 🏗️ Architecture

```
Browser (Vite + React 19 SPA)
      │
      │  fetch  /api/*        (same origin — no separate backend host)
      ▼
Vercel Serverless Function  ──►  frontend/api/index.ts   (the whole API)
      │
      ├─ Prisma 7 + @prisma/adapter-pg ──►  Supabase Postgres (Supavisor pooler)
      └─ Groq  (llama-3.1-8b-instant)  ──►  chat streaming + report/topic generation
```

There is **no NestJS server and no separate backend deployment**. Everything the
API does lives in one file, `frontend/api/index.ts`, routed under `/api/*` by the
root `vercel.json`. The SPA and the API share an origin, so the browser just calls
relative `/api/...` paths.

### Why the connection pooler matters

The function is serverless, so every invocation may open a fresh DB connection.
It connects through the **Supabase Supavisor pooler**, not the direct database host:

| URL           | Host / port                              | Used by                         |
|---------------|------------------------------------------|---------------------------------|
| `DATABASE_URL` | `...pooler.supabase.com:6543` (transaction) | the API at runtime             |
| `DIRECT_URL`   | `...pooler.supabase.com:5432` (session)     | `prisma migrate` (CLI only)    |

> ⚠️ The direct host (`db.<ref>.supabase.co:5432`) is **IPv6-only and unreachable
> from Vercel** — using it makes every query hang. Always use the pooler.

At runtime the API builds its client with a driver adapter
(`new PrismaClient({ adapter: new PrismaPg(pool) })`, pool capped at `max: 1`), so
the schema itself carries no connection URL. The CLI reads its URL from
`frontend/prisma.config.ts`.

---

## 📂 Project Structure

```
.
├── vercel.json                 # build + routing: /api/* → function, /* → SPA
├── .env.example                # env template (JWT, Supabase pooler, Groq)
└── frontend/
    ├── api/
    │   └── index.ts            # ← the entire backend (one serverless function)
    ├── prisma/
    │   └── schema.prisma       # User · Simulation · Report · Notification
    ├── prisma.config.ts        # Prisma 7 CLI config (migrate/introspect)
    ├── src/
    │   ├── api/                # client wrapper + per-feature fetch helpers
    │   ├── context/            # AuthContext (JWT in localStorage)
    │   ├── pages/              # routes (Dashboard, NewSimulation, Results, Admin…)
    │   ├── components/
    │   └── hooks/
    └── package.json
```

---

## 🔌 API

All routes are served by `frontend/api/index.ts` under the `/api` prefix. Auth is a
Bearer JWT (15-minute expiry) in the `Authorization` header. Responses use a
standard envelope: `{ success, message, data, errors }`.

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | password ≥ 8 chars |
| POST | `/api/auth/login` | returns access token |
| GET/PATCH/DELETE | `/api/users/me` | current user |
| PATCH | `/api/users/me/password` | change password |
| GET | `/api/simulations/public` | public gallery |
| GET/POST | `/api/simulations` | list (paginated) / create |
| GET/PATCH/DELETE | `/api/simulations/:id` | single simulation |
| POST | `/api/simulations/:id/analyze` | run the scoring engine |
| GET | `/api/simulations/:id/results` | report (public sims need no auth) |
| GET | `/api/ai/advisor-insight` | live advisor insight |
| POST | `/api/ai/generate-topic` | derive title + category from a prompt |
| POST | `/api/ai/simulations/:id/chat` | **SSE** streaming chat |
| GET | `/api/analytics/dashboard-stats` · `/market-correlation` · `/system-meta` | |
| GET | `/api/admin/users` | **ADMIN role required** |
| POST | `/api/reports/generate/:simulationId` | generate AI report |
| GET | `/api/reports/simulations/:id` | fetch a report |

---

## ⚙️ Local Development

All commands run from `frontend/`.

```bash
cd frontend
npm install

# Fill in secrets (repo-root .env — see .env.example for the template)
#   JWT_SECRET, DATABASE_URL, DIRECT_URL, GROQ_API_KEY
npx prisma generate      # generate the Prisma client
npx prisma migrate deploy  # apply migrations (uses DIRECT_URL)

npm run dev              # Vite dev server (SPA)
```

For the API to respond locally, run the SPA through the Vercel dev server so the
`/api/*` function is mounted:

```bash
npx vercel dev          # from the repo root
```

| Command (in `frontend/`) | Description |
|--------------------------|-------------|
| `npm run dev`   | Vite dev server |
| `npm run build` | Production build → `frontend/dist` |
| `npm run preview` | Preview the built SPA |
| `npm run lint`  | oxlint |

---

## ☁️ Deploying to Vercel

The root `vercel.json` drives everything — build, output directory, the function
runtime, and routing. Import the repo into Vercel and set these **Environment
Variables** in the dashboard (Project → Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | a long random string (`openssl rand -hex 32`) |
| `DATABASE_URL` | Supabase **transaction** pooler URL (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase **session** pooler URL (port 5432) |
| `GROQ_API_KEY` | primary AI provider — https://console.groq.com/keys |
| `GEMINI_API_KEY` | *(optional)* automatic backup if Groq is rate-limited/down — https://aistudio.google.com/apikey |

The API calls **Groq first**; if Groq is rate-limited, errors, or unreachable and
`GEMINI_API_KEY` is set, it transparently retries the same request against Google
Gemini's OpenAI-compatible endpoint. Without `GEMINI_API_KEY` it just uses Groq.

The build command (in `vercel.json`) installs deps, runs `prisma generate`, and
builds the SPA. Routing sends `/api/*` to the serverless function and everything
else to the SPA's `index.html`.

> Local `.env` / `.env.local` files are **not** used by production — Vercel reads
> env vars from its dashboard only.

---

## 🛠️ Tech Stack

- **Frontend:** Vite 8, React 19, React Router 7, Recharts, three.js / react-three-fiber
- **Backend:** one Vercel Node serverless function (TypeScript)
- **Database:** Supabase Postgres via Prisma 7 + `@prisma/adapter-pg` (node-postgres)
- **AI:** Groq — `llama-3.1-8b-instant` (SSE streaming), with Google Gemini (`gemini-flash-latest`) as an automatic failover
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`

---

## 📄 License

MIT
