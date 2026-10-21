# Cathoot

O Kahoot de crimes de gato: a turma vota se cada gato é **Culpado** ou **Inocente** pelo crime cometido.

Projeto de **S107 - Gerência de Configuração e Evolução de Software**.

## Stack

- **Frontend:** Next.js + shadcn/ui
- **Backend:** NestJS + Prisma
- **Banco de dados:** PostgreSQL
- **Infra local:** Docker Compose
- **Testes E2E:** Playwright
- **Deploy:** Vercel
- **CI/CD:** Jenkins

## Como rodar

```bash
pnpm install
pnpm --filter web dev               # desenvolvimento, em http://localhost:3000
pnpm generate                       # gera o client do Prisma (depois do install)
pnpm --filter api dev               # API em http://localhost:3001 (precisa de DATABASE_URL e PRESENTER_PASSWORD)
pnpm test                           # testes unitários de todos os pacotes
pnpm --filter api test:integration  # testes da API contra o Postgres (DATABASE_URL)

docker compose up -d --build        # aplicação completa em containers (web, api e postgres)
```

A senha do apresentador no compose é `miau` (mude com `PRESENTER_PASSWORD` no `.env`). Endpoints da API em [docs/api.md](docs/api.md).

## Jenkins local

Sobe junto com o app, no mesmo `docker compose up -d`, se o perfil `jenkins` estiver ligado:

```bash
cp .env.example .env                   # liga o perfil jenkins
cp jenkins/.env.example jenkins/.env   # preencher senha e token do GitHub
docker compose up -d --build
```

Abre em <http://localhost:8080> (usuário `admin`), já com o job `cathoot` criado. Sem esses `.env`, o compose sobe só o app. Detalhes em [docs/pipeline.md](docs/pipeline.md).

#### Marco Di Toro | 150 | GES