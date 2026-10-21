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
- Banco: Postgres. No Compose é o serviço `postgres` (volume `pgdata`); se a API for para a nuvem, um Postgres hospedado (Neon ou Vercel Postgres).
- Gatos vêm de um **catálogo em arquivos** (`apps/api/catalog/`), sem upload: um `gatos.yaml` com nome e crime de cada id e uma imagem `<id>.jpg|png` por gato (YAML pela leitura fácil e por aceitar comentários; dependência `yaml`). Tudo versionado no repositório, então não depende de link de meme que some, e o Docker e o E2E usam sempre os mesmos dados. A API é a dona do catálogo e serve as imagens; o `web` só mostra. O domínio ainda aceita imagem por URL `http(s)` para gatos avulsos.
- Tempo real por **polling** (~1,5 s), sem WebSocket.
- E2E no Playwright com dois navegadores (apresentador e aluno).

## Gerenciador de pacotes: somente pnpm

Nunca usar `npm` nem `yarn`, nem gerar `package-lock.json` ou `yarn.lock`.

- Travado por `packageManager` e `engines` no `package.json`, `engine-strict=true` no `.npmrc` e `preinstall: only-allow pnpm`.
- No Jenkins e nos Dockerfiles, ativar via `corepack enable` para usar a versão fixada em `packageManager`.
- Commitar o `pnpm-lock.yaml` e instalar no CI com `pnpm install --frozen-lockfile`.
- As imagens usam **Node 24** (LTS ativo), que ainda traz o corepack. A partir do Node 25 o corepack não vem mais junto, então localmente o pnpm precisa estar instalado à parte.
- O pnpm bloqueia versões publicadas há pouco tempo (`minimumReleaseAge`) e, ao instalar, pode editar o `pnpm-workspace.yaml` sozinho (`minimumReleaseAgeExclude`, `allowBuilds`). Não aceitar a exceção de idade: fixar uma versão mais antiga. Sempre conferir o diff do `pnpm-workspace.yaml` depois de adicionar dependências.
- Scripts de build de dependências ficam em `allowBuilds` do `pnpm-workspace.yaml`. O `pnpm` escreve um placeholder ("set this to true or false") que quebra o `pnpm install` no CI (`ERR_PNPM_IGNORED_BUILDS`): trocar sempre por `true` ou `false`. Hoje só `@prisma/engines` é `true`, porque baixa o binário que aplica as migrations; o `prisma` só tem um `preinstall` de verificação (`false`).

## API (`apps/api`)

- NestJS 12 é **ESM** (`"type": "module"`, `module: nodenext`): imports relativos levam a extensão `.js`, mesmo em arquivos `.ts`.
- Build com `nest build` (saída em `dist/`); `pnpm --filter api dev` roda com watch.
- Porta `API_PORT` (padrão 3001), escutando em `0.0.0.0` para funcionar em container. O `web` fica na 3000.
- `GET /health` responde `{"status":"ok"}` e será o healthcheck do container da API.
- Testes com **Vitest** (`src/**/*.spec.ts`), sem plugin do SWC: o Vite 8 já gera o decorator metadata que a injeção de dependência do Nest precisa. Com `CI=true` também sai JUnit em `test-results/`.
- ESLint 9 + `typescript-eslint` e TypeScript 5, as mesmas linhas do `web`. O `typescript-eslint` está fixo na 8.71.0 (a mesma do `web`).

- Prisma 7 com o adaptador `@prisma/adapter-pg` (sem engine em Rust). O client é gerado em `apps/api/src/generated/prisma` (não versionado): rode `pnpm generate` depois do `pnpm install`. O Jenkins e o Dockerfile fazem isso.
- Schema e migrations em `apps/api/prisma/`. Criar migration: `DATABASE_URL=... pnpm --filter api exec prisma migrate dev --name <nome>`. A imagem da API roda `prisma migrate deploy` ao subir, antes do `node dist/main.js`.
- Variáveis da API: `DATABASE_URL` e `PRESENTER_PASSWORD` são obrigatórias (a API não sobe sem elas). No compose ambas têm padrão de desenvolvimento (`miau` para a senha).
- A API guarda cada sala em memória e grava um snapshot no Postgres a cada ação (ver [regras-de-negocio.md](regras-de-negocio.md)). Isso exige **uma só instância** da API.
- Erros do domínio viram `{ "code", "message" }` com status HTTP pelo `DomainErrorFilter`. Endpoints em [api.md](api.md).

## Docker

- `docker-compose.yml` na raiz sobe a aplicação inteira (`docker compose up --build`). Tem `postgres`, `api` e `web`. A `api` só sobe depois do Postgres saudável (`depends_on` com `service_healthy`).
- `apps/web/Dockerfile` é multi-stage e usa a saída `standalone` do Next, então a imagem final não leva pnpm nem código-fonte. O contexto do build é a raiz do monorepo, por causa do lockfile e do workspace.
- O healthcheck fica no compose e usa `node` + `fetch`, porque a imagem slim não tem curl.
- `WEB_PORT`, `API_PORT` e `POSTGRES_PORT` definem as portas publicadas (padrão 3000, 3001 e 5432). Com `0`, o Docker escolhe uma porta livre (usado no CI).
- `apps/api/Dockerfile` é multi-stage, mas a imagem final leva o `node_modules` inteiro de propósito: precisa do CLI do Prisma para aplicar as migrations ao subir.
- O Jenkins é um serviço em `jenkins/docker-compose.yml`, incluído pelo compose da raiz com `profiles: ["jenkins"]` (ver [pipeline.md](pipeline.md)). Só sobe com `COMPOSE_PROFILES=jenkins` no `.env` da raiz.

## Deploy na Vercel

- **Root Directory = `./apps/web`**.
- Production Branch (Settings → Git) deve ser `master`.
- Deploy só quando o código do `apps/web` muda: `ignoreCommand` em `apps/web/vercel.json` (`git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md'`, roda dentro do Root Directory).
- O **Skip deployment** automático da Vercel não basta: arquivos fora do workspace (`apps/*`), como o `README.md` e o `CLAUDE.md` da raiz, contam como mudança global e geram deploy.
- Custo: builds cancelados pelo `ignoreCommand` contam na cota de deployments.
