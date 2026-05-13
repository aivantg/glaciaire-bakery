# syntax=docker/dockerfile:1
#
# Optimized for Dokku deploys:
#  - Shared base stage installs apk packages once and is cached across builds.
#  - npm cache mount (/root/.npm) survives between builds, so even a fresh
#    `npm ci` is fast after the first deploy.
#  - Next.js build cache mount (/app/.next/cache) keeps SWC + webpack artifacts
#    warm across deploys, cutting `next build` time dramatically.
#  - prod-deps is a separate stage so the final image ships without
#    devDependencies (eslint, types, tailwind tooling, etc.).
#
# Requires BuildKit. Dokku 0.30+ enables it by default. For older versions:
#   dokku config:set --no-restart <app> DOCKER_BUILDKIT=1

# ─── Base: alpine + openssl, shared by every stage ────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── deps: full install (dev + prod) for building ─────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

# ─── builder: compile Next.js with a persistent build cache ───────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/app/.next/cache,sharing=locked \
    npm run build

# ─── prod-deps: production-only node_modules for the runtime image ────────────
FROM base AS prod-deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev

# ─── runner: minimal runtime ──────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 5000

CMD ["npm", "run", "start"]
