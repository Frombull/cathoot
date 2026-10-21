# Contexto do build: raiz do monorepo (precisa do lockfile e do workspace)
ARG NODE_IMAGE=node:24.22.0-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
RUN pnpm --filter api generate && pnpm --filter api build

# O runner leva o node_modules inteiro de propósito: precisa do CLI do Prisma para aplicar as migrations ao subir
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=production \
    API_PORT=3001
WORKDIR /repo
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/api/node_modules apps/api/node_modules
COPY --from=build --chown=node:node /repo/apps/api/dist apps/api/dist
COPY --from=build --chown=node:node /repo/apps/api/prisma apps/api/prisma
COPY --from=build --chown=node:node /repo/apps/api/prisma.config.ts /repo/apps/api/package.json apps/api/
COPY --from=build --chown=node:node /repo/apps/api/catalog apps/api/catalog
WORKDIR /repo/apps/api
USER node
EXPOSE 3001
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
