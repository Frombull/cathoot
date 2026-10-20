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
pnpm --filter api dev               # API em http://localhost:3001 (GET /health)
pnpm test                           # testes unitários de todos os pacotes

docker compose up -d --build        # aplicação completa em containers
```

## Jenkins local

Sobe junto com o app, no mesmo `docker compose up -d`, se o perfil `jenkins` estiver ligado:

```bash
cp .env.example .env                   # liga o perfil jenkins
cp jenkins/.env.example jenkins/.env   # preencher senha e token do GitHub
docker compose up -d --build
```

Abre em <http://localhost:8080> (usuário `admin`), já com o job `cathoot` criado. Sem esses `.env`, o compose sobe só o app. Detalhes em [docs/pipeline.md](docs/pipeline.md).

#### Marco Di Toro | 150 | GES