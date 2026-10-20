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

- Monorepo único: `apps/web` (Next.js) e `apps/api` (NestJS), com workspace pnpm na raiz.
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
- O pnpm bloqueia versões publicadas há pouco tempo (`minimumReleaseAge`) e, ao instalar, pode editar o `pnpm-workspace.yaml` sozinho (`minimumReleaseAgeExclude`, `allowBuilds`). Não aceitar a exceção de idade: fixar uma versão mais antiga. Sempre conferir o diff do `pnpm-workspace.yaml` depois de adicionar dependências.

## API (`apps/api`)

- NestJS 12 é **ESM** (`"type": "module"`, `module: nodenext`): imports relativos levam a extensão `.js`, mesmo em arquivos `.ts`.
- Build com `nest build` (saída em `dist/`); `pnpm --filter api dev` roda com watch.
- Porta `API_PORT` (padrão 3001), escutando em `0.0.0.0` para funcionar em container. O `web` fica na 3000.
- `GET /health` responde `{"status":"ok"}` e será o healthcheck do container da API.
- Testes com **Vitest** (`src/**/*.spec.ts`), sem plugin do SWC: o Vite 8 já gera o decorator metadata que a injeção de dependência do Nest precisa. Com `CI=true` também sai JUnit em `test-results/`.
- ESLint 9 + `typescript-eslint` e TypeScript 5, as mesmas linhas do `web`. O `typescript-eslint` está fixo na 8.71.0 (a mesma do `web`).

## Docker

- `docker-compose.yml` na raiz sobe a aplicação inteira (`docker compose up --build`). Hoje só tem o `web`; a API e o Postgres entram nele quando existirem.
- `apps/web/Dockerfile` é multi-stage e usa a saída `standalone` do Next, então a imagem final não leva pnpm nem código-fonte. O contexto do build é a raiz do monorepo, por causa do lockfile e do workspace.
- O healthcheck fica no compose e usa `node` + `fetch`, porque a imagem slim não tem curl.
- `WEB_PORT` define a porta publicada (padrão 3000). Com `0`, o Docker escolhe uma porta livre (usado no CI).
- O Jenkins é um serviço em `jenkins/docker-compose.yml`, incluído pelo compose da raiz com `profiles: ["jenkins"]` (ver [pipeline.md](pipeline.md)). Só sobe com `COMPOSE_PROFILES=jenkins` no `.env` da raiz.

## Deploy na Vercel

- **Root Directory = `./apps/web`**.
- Production Branch (Settings → Git) deve ser `master`.
- Deploy só quando o código do `apps/web` muda: `ignoreCommand` em `apps/web/vercel.json` (`git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md'`, roda dentro do Root Directory).
- O **Skip deployment** automático da Vercel não basta: arquivos fora do workspace (`apps/*`), como o `README.md` e o `CLAUDE.md` da raiz, contam como mudança global e geram deploy.
- Custo: builds cancelados pelo `ignoreCommand` contam na cota de deployments.
