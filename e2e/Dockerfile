# Contexto do build: raiz do monorepo (precisa do lockfile e do workspace)
# A tag tem que ser a mesma versão do @playwright/test em e2e/package.json: os navegadores vêm na imagem
FROM mcr.microsoft.com/playwright:v1.64.1-noble

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true
RUN corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY e2e/package.json e2e/
RUN pnpm install --frozen-lockfile
COPY e2e e2e

WORKDIR /repo/e2e
CMD ["pnpm", "exec", "playwright", "test"]
