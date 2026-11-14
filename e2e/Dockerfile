# Contexto do build: raiz do monorepo (precisa do lockfile e do workspace)
# A tag tem que ser a mesma versão do @playwright/test em e2e/package.json: os navegadores vêm na imagem
FROM mcr.microsoft.com/playwright:v1.64.1-noble

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    CI=true
# A imagem vem com Node 26, que não traz mais o corepack (saiu do Node no 25): instala pelo npm.
# O corepack lê o "packageManager" do package.json e usa o mesmo pnpm do resto do monorepo.
# O yarn global da imagem sai antes, porque o corepack instala um atalho com o mesmo nome
RUN npm uninstall -g yarn && npm install -g corepack@0.36.0 && corepack enable
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY e2e/package.json e2e/
RUN pnpm install --frozen-lockfile
COPY e2e e2e

WORKDIR /repo/e2e
CMD ["pnpm", "exec", "playwright", "test"]
