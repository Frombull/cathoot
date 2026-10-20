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

docker compose up --build           # aplicação completa em containers
```

## Jenkins local

```bash
cp jenkins/.env.example jenkins/.env   # preencher senha e token do GitHub
docker compose -f jenkins/docker-compose.yml up -d --build
```

Abre em <http://localhost:8080> (usuário `admin`), já com o job `cathoot` criado. Detalhes em [docs/pipeline.md](docs/pipeline.md).

#### Marco Di Toro | 150 | GES