# =============================================================
# Stage 0 — Base : node 22 + pnpm 9.15.0
# =============================================================
FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# =============================================================
# Stage 1 — Deps : installe uniquement le workspace web
# =============================================================
FROM base AS deps
WORKDIR /app

# Manifestes en premier pour profiter du cache des layers Docker
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter web...

# =============================================================
# Stage 2 — Builder : compile Next.js en mode standalone
# =============================================================
FROM base AS builder
WORKDIR /app

# Réutilise les node_modules installés dans le stage deps
# (même WORKDIR /app → les symlinks pnpm restent valides)
COPY --from=deps /app ./

# Sources de l'application (node_modules exclus via .dockerignore)
COPY . .

RUN pnpm --filter web build

# =============================================================
# Stage 3 — Runner : image de production minimale
# =============================================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Serveur standalone Next.js (monorepo → apps/web/server.js)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Assets statiques (pas de dossier public/ dans ce projet)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# scores.json : loadGames() lit process.cwd()/data/scores.json
# CWD au runtime = /app (WORKDIR), donc on place le fichier dans /app/data/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/data ./data

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
