# Build context: monorepo root
# docker build -f apps/web/Dockerfile .

# ---- Stage 1: build ----
FROM node:20-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Workspace config needed for pnpm lockfile resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter @qualitycat-academy/web

# Copy source
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
COPY apps/web/index.html apps/web/
COPY apps/web/vite.config.ts apps/web/
COPY apps/web/tsconfig.json apps/web/

# Build-time args — baked into the static bundle by Vite
ARG VITE_API_URL=""
ARG VITE_BUGS="off"
ARG VITE_BUG_UI_DOUBLE_SUBMIT=""
ARG VITE_BUG_CACHE_STALE=""
ARG VITE_BUG_TIMEZONE_SHIFT=""
ARG VITE_BUG_ERROR_MESSAGE=""
ARG VITE_BUG_FORM_VALIDATION=""
ARG VITE_BUG_XSS_DESCRIPTION=""

WORKDIR /app/apps/web
RUN pnpm build

# ---- Stage 2: runtime ----
FROM nginx:alpine

# Custom nginx config (SPA fallback, gzip, cache)
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf

# Static files from Vite build
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
