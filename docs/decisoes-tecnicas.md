# Decisões técnicas

## Stack

- Frontend: Next.js + shadcn/ui
- Backend: NestJS + Prisma
- Banco: PostgreSQL
- Infra local: Docker Compose
- E2E: Playwright
- Deploy: Vercel
- CI/CD: Jenkins

## Estrutura

- Monorepo único: `apps/web` (Next.js) e `apps/api` (NestJS, virá depois), com workspace pnpm na raiz.
- Banco: Postgres hospedado (Neon ou Vercel Postgres) com pooling do Prisma. Docker Compose só para dev local e CI.
- Imagens dos gatos por **URL** (sem upload).
- Tempo real por **polling** (~1,5 s), sem WebSocket.
- E2E no Playwright com dois navegadores (apresentador e aluno).

## Gerenciador de pacotes: somente pnpm

Nunca usar `npm` nem `yarn`, nem gerar `package-lock.json` ou `yarn.lock`.

- Travado por `packageManager` e `engines` no `package.json`, `engine-strict=true` no `.npmrc` e `preinstall: only-allow pnpm`.
- No Jenkins e nos Dockerfiles, ativar via `corepack enable` para usar a versão fixada em `packageManager`.
- Commitar o `pnpm-lock.yaml` e instalar no CI com `pnpm install --frozen-lockfile`.
- As imagens usam **Node 24** (LTS ativo), que ainda traz o corepack. A partir do Node 25 o corepack não vem mais junto, então localmente o pnpm precisa estar instalado à parte.

## Docker

- `docker-compose.yml` na raiz sobe a aplicação inteira (`docker compose up --build`). Hoje só tem o `web`; a API e o Postgres entram nele quando existirem.
- `apps/web/Dockerfile` é multi-stage e usa a saída `standalone` do Next, então a imagem final não leva pnpm nem código-fonte. O contexto do build é a raiz do monorepo, por causa do lockfile e do workspace.
- O healthcheck fica no compose e usa `node` + `fetch`, porque a imagem slim não tem curl.
- `WEB_PORT` define a porta publicada (padrão 3000). Com `0`, o Docker escolhe uma porta livre (usado no CI).
- O Jenkins tem o próprio compose em `jenkins/` (ver [pipeline.md](pipeline.md)).

## Deploy na Vercel

- **Root Directory = `./apps/web`**.
- Production Branch (Settings → Git) deve ser `master`.
- Deploy só quando o código do `apps/web` muda: `ignoreCommand` em `apps/web/vercel.json` (`git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md'`, roda dentro do Root Directory).
- O **Skip deployment** automático da Vercel não basta: arquivos fora do workspace (`apps/*`), como o `README.md` e o `CLAUDE.md` da raiz, contam como mudança global e geram deploy.
- Custo: builds cancelados pelo `ignoreCommand` contam na cota de deployments.
