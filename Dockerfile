# syntax=docker/dockerfile:1
#
# Optimized for Dokku deploys:
#  - Single `npm ci`, then `npm prune --omit=dev` in place after the build —
#    avoids a second full install for the runtime image.
#  - `--prefer-offline --no-progress` lets npm reuse cached tarballs and
#    skips the progress UI.
#  - BuildKit cache mounts persist /root/.npm (package tarballs) and
#    /app/.next/cache (SWC + webpack) across deploys.
#  - Shared `base` stage installs apk packages once.
#
# Requires BuildKit. Dokku 0.30+ enables it by default. For older versions:
#   dokku config:set --no-restart <app> DOCKER_BUILDKIT=1

# ─── Base: alpine + openssl, reused by every stage ────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── Builder: install, build, prune ───────────────────────────────────────────
FROM base AS builder

# Install all deps (cached if package files are unchanged).
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-progress

# Build Next.js with a persistent build cache.
COPY . .
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Strip dev deps in place — much faster than a second `npm ci --omit=dev`.
RUN npm prune --omit=dev

# ─── Runner: minimal runtime ──────────────────────────────────────────────────
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
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 5000

CMD ["npm", "run", "start"]
