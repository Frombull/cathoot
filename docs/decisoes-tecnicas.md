# Decisões técnicas

## Stack

- Frontend: Next.js + shadcn/ui
- Backend: NestJS + Prisma
- Banco: PostgreSQL
- Infra local: Docker Compose
- E2E: Playwright
- Carga: k6
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

## Front (`apps/web`)

- Next.js 16 (App Router). As páginas leem `params`/`searchParams` (que são `Promise`) no servidor e passam o código da sala para um componente de cliente; todo o jogo roda no cliente.
- Rotas: `/criar` (senha), `/entrar?codigo=` (código + nome), `/sala/<código>` (aluno) e `/sala/<código>/apresentador` (telão). O código da URL é normalizado como na API.
- Polling no hook `useSessionView` (`src/hooks/`): uma consulta por vez, a cada 1,5 s; para no `FIM` e em erro fatal (`SESSION_NOT_FOUND`, `PARTICIPANT_NOT_FOUND`); erro de rede mantém a última tela. A resposta de "Começar/Revelar/Próximo" já atualiza a tela, e uma consulta que saiu antes dela é descartada.
- `localStorage` lido com `useSyncExternalStore` (sem `setState` em efeito, que o lint do React 19 recusa).
- Imagens dos gatos com `<img>` simples: vêm da API (via rewrite) ou de URL externa, sem o otimizador do `next/image`.
- QR code com `qrcode.react` (SVG). Ele usa o endereço da página: abrir o telão em `localhost` gera um QR inútil para os celulares, então o painel mostra uma dica para usar o IP da rede.

### shadcn/ui

- Instalado com estilo `radix-nova` (`components.json`); componentes em `src/components/ui/` (`button`, `input`, `label`). O `Button` ganhou variantes do jogo (`accent`, `guilty`, `innocent`) e o tamanho `xl`: no shadcn o código é nosso e pode ser editado.
- **Não rodar `shadcn init` de novo.** Em 2026-10-22 ele trocou as fontes por `next/font/google` (Geist), sobrescreveu o tema do `globals.css`, colocou o próprio `shadcn` como dependência de runtime e atualizou pacotes sem relação no lockfile. Foi tudo revertido. Para novos componentes, `pnpm dlx shadcn@<versão> add <nome> --dry-run`, depois sem `--dry-run`, e conferir o diff.
- Dependências: `radix-ui` (pacote único com todos os primitivos, o padrão atual do shadcn), `class-variance-authority` e `cn` (do próprio shadcn, substitui `clsx` + `tailwind-merge`).

### Testes do front

- Vitest + Testing Library + jsdom (`vitest.config.mts`, `src/**/*.spec.ts(x)`), JUnit em `test-results/` com `CI=true`, como na API. O `@types/node` do `web` foi para a 24 (o Vitest 5 pede 22+ e as imagens rodam Node 24).
- Cobrem o cliente da API, o armazenamento local, o polling (com relógio falso) e as telas do aluno e do apresentador com `fetch` falso.

## E2E (`e2e/`)

- Pacote próprio no workspace, com Playwright e um teste de dois navegadores (apresentador no desktop, aluno num Pixel 7). Os testes não dependem dos nomes do catálogo: leem o gato da vez na tela.
- `e2e/Dockerfile` usa a imagem oficial `mcr.microsoft.com/playwright`, que já traz os navegadores. **A tag precisa ser a mesma versão do `@playwright/test`** do `e2e/package.json` (por isso a versão é fixa, sem `^`).
- O serviço `e2e` do compose tem `profiles: ["e2e"]`: o `docker compose up` normal não o sobe.
- Rodar localmente: `docker compose up -d --build` e `docker compose --profile e2e run --rm e2e`, ou, fora do Docker, `pnpm --filter e2e exec playwright install chromium` uma vez e `BASE_URL=http://localhost:3000 pnpm e2e`.

## Teste de carga (`load/`)

- **k6** (`load/votacao.js`), na imagem oficial `grafana/k6` com versão fixa. Não é pacote do workspace: o k6 é um binário em Go, não um pacote npm.
- Simula a sala de aula numa sala só:
  - Os alunos (`STUDENTS`, padrão 60) chegam aos poucos ao longo de 10 s.
  - Cada um consulta a sala a cada 1,5 s, como o celular, e baixa a foto de cada gato.
  - Cada um vota em até 3 s depois que o gato aparece.
  - O apresentador espera todo mundo entrar e votar, revela e passa para o próximo gato até o `FIM`.
  - Passa pelo `web` (rewrite do Next), o mesmo caminho dos navegadores. Lê o número de gatos da própria sala, então não depende do catálogo.
- O estágio reprova se algum destes limites estourar:
  - Falhas HTTP: menos de 1%.
  - p95 da consulta: abaixo de 500 ms.
  - p95 de entrar e de votar: abaixo de 1 s.
  - p95 da foto: abaixo de 2 s.
  - Votos: todos contados em todos os gatos.
  - Jogo: precisa chegar ao fim.
- Se o jogo trava, o apresentador aborta o teste (`exec.test.abort`), senão os alunos ficariam no polling até o `maxDuration`.
- **Só módulos embutidos** (`k6/http`, `k6/metrics`...). O k6 2 tenta baixar um binário sob medida quando vê um import desconhecido, e o `k6/summary` não existe. Por isso o resumo em português e o JUnit (um caso por limite) são escritos à mão no `handleSummary`.
- O relatório HTML é o *web dashboard* do k6, exportado no fim (`K6_WEB_DASHBOARD_EXPORT`), sem nada externo. Em testes de poucos segundos o k6 pula o relatório por falta de dados.
- Rodar localmente: `docker compose up -d --build` e `docker compose --profile load run --rm load`. Para mais gente: `-e STUDENTS=300`.
- **Resultados** (2026-10-22, tudo no mesmo Mac com OrbStack, k6 incluso):

  | Alunos | Votar (p95) | Consultar (p95) | Resultado |
  | --- | --- | --- | --- |
  | 60 | 19 ms | 10 ms | passa com folga |
  | 300 | 27 ms | 8 ms | passa com folga |
  | 1000 | 16,6 s | 3,8 s | todos os votos contados e o jogo chega ao fim, mas os limites de tempo estouram |

  - Para uma turma, sobra muita folga.
  - A partir de algumas centenas de alunos, o gargalo provável é a fila de gravações da sala:
    - Cada voto grava o snapshot inteiro da sala no banco.
    - O snapshot cresce com a turma.
    - Cada voto ainda espera as gravações anteriores.
  - Se um dia precisar de mais gente, o caminho é juntar as gravações pendentes numa só.

## Docker

- `docker-compose.yml` na raiz sobe a aplicação inteira (`docker compose up --build`). Tem `postgres`, `api` e `web`. A `api` só sobe depois do Postgres saudável (`depends_on` com `service_healthy`).
- `apps/web/Dockerfile` é multi-stage e usa a saída `standalone` do Next, então a imagem final não leva pnpm nem código-fonte. O contexto do build é a raiz do monorepo, por causa do lockfile e do workspace.
- O healthcheck fica no compose e usa `node` + `fetch`, porque a imagem slim não tem curl. O do `web` também chama `/api/health` pelo rewrite, e o `web` só sobe depois da `api` saudável.
- O `apps/web/Dockerfile` recebe `API_URL` como `ARG` (padrão `http://api:3001`), porque os rewrites do Next ficam fixos no build.
- Rede lenta: o pnpm 11 confere cada item do lockfile no registro (a política de idade mínima) e baixa metadados completos (o do `prisma` tem 44 MB). Numa conexão de ~2 MB/s (2026-10-22), o `pnpm install` das imagens levou mais de 7 minutos e estourou o timeout padrão de 60 s por requisição. Por isso `fetchTimeout: 300000` (5 min) no `pnpm-workspace.yaml`: numa rede boa não muda nada, é só o teto.
- `WEB_PORT`, `API_PORT` e `POSTGRES_PORT` definem as portas publicadas (padrão 3000, 3001 e 5432). Com `0`, o Docker escolhe uma porta livre (usado no CI).
- `apps/api/Dockerfile` é multi-stage, mas a imagem final leva o `node_modules` inteiro de propósito: precisa do CLI do Prisma para aplicar as migrations ao subir.
- O Jenkins é um serviço em `jenkins/docker-compose.yml`, incluído pelo compose da raiz com `profiles: ["jenkins"]` (ver [pipeline.md](pipeline.md)). Só sobe com `COMPOSE_PROFILES=jenkins` no `.env` da raiz.

## Deploy na Vercel

- **Root Directory = `./apps/web`**.
- Production Branch (Settings → Git) deve ser `master`.
- Deploy só quando o código do `apps/web` muda: `ignoreCommand` em `apps/web/vercel.json` (`git diff --quiet HEAD^ HEAD -- . ':(exclude)*.md'`, roda dentro do Root Directory).
- O **Skip deployment** automático da Vercel não basta: arquivos fora do workspace (`apps/*`), como o `README.md` e o `CLAUDE.md` da raiz, contam como mudança global e geram deploy.
- Custo: builds cancelados pelo `ignoreCommand` contam na cota de deployments.
