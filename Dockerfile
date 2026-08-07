# ── FuturePath AI backend — production image ────────────────────────────────
# Deployable on Render (via render.yaml), Railway, Fly.io, or any container host.
#
# Runtime needs: DATABASE_URL (MySQL/MariaDB, TLS when DATABASE_SSL=true),
# OPENCODEZEN_API_KEY, JWT secrets, CORS_ORIGINS. Redis/BullMQ are optional.

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (cached unless package-lock.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Source + Prisma (generate needs schema + config)
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

# Generate the Prisma client and compile to dist/
RUN npx prisma generate
RUN npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS release
WORKDIR /app
ENV NODE_ENV=production

# Prisma engines + the prisma CLI (migrate deploy) live in node_modules.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

# Run pending migrations, then start the API.
# Note: nest emits to dist/src/main.js (the root prisma.config.ts widens rootDir),
# so the entry is dist/src/main, not dist/main.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
