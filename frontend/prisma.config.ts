// Prisma 7 CLI config (migrate / introspect). The runtime client does NOT use this —
// api/index.ts constructs PrismaClient with a @prisma/adapter-pg driver adapter.
//
// Migrations use DIRECT_URL (Supabase SESSION pooler, port 5432); the transaction
// pooler on 6543 can't run them. Env vars are loaded from the repo-root .env for
// local use — on Vercel they come from the dashboard and `generate` needs no URL.
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from '@prisma/config';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, '..', '.env') });

export default defineConfig({
  schema: resolve(here, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
