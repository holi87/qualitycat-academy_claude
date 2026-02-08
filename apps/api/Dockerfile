# Build context: monorepo root
# docker build -f apps/api/Dockerfile .

# ---- Stage 1: deps ----
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Workspace config needed for pnpm lockfile resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --filter @qualitycat-academy/api

# ---- Stage 2: build ----
FROM deps AS build

COPY apps/api/src apps/api/src
COPY apps/api/prisma apps/api/prisma
COPY apps/api/tsconfig.json apps/api/

WORKDIR /app/apps/api
RUN npx prisma generate
RUN pnpm build

# Create standalone deployment with flat node_modules (no symlinks)
WORKDIR /app
RUN pnpm --filter @qualitycat-academy/api deploy --prod /deploy

# ---- Stage 3: runtime ----
FROM node:20-alpine

RUN apk add --no-cache curl
RUN npm install -g prisma

WORKDIR /app

# Flat prod node_modules from pnpm deploy
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./

# Compiled source (rootDir: "." → dist/src/, dist/prisma/)
COPY --from=build /app/apps/api/dist ./dist

# Prisma schema (for migrations) + generated client
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Entrypoint script
COPY apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

ENV NODE_ENV=production
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8081/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
