# Arquitetura

## Aplicação

```mermaid
flowchart LR
    APR["Apresentador<br/>(senha + QR code)"]
    ALU["Alunos<br/>(QR ou código da sala, só nome)"]
    WEB["apps/web<br/>Next.js + shadcn/ui<br/>(Vercel)"]
    API["apps/api<br/>NestJS + Prisma<br/>(Docker)"]
    DB[("PostgreSQL")]

    APR --> WEB
    ALU --> WEB
    WEB -. "polling ~1,5 s" .-> API
    API --> DB
```

- A API concentra as regras de negócio (estados da sessão, voto único) e expõe REST para sessão, gatos, participantes e votos.
- Tempo real por **polling**, sem WebSocket.
- O navegador só fala com o `web`; o Next repassa `/api/*` e `/cats/*` para a API (ver [api.md](api.md)).
- Identidade do aluno: nome + `participantId` guardado no navegador (`localStorage`).
- Banco: PostgreSQL. A sala vive em memória na API e é gravada no banco a cada ação (snapshot), então sobrevive a um reinício.
- Deploy: `apps/web` vai na Vercel (Root Directory `apps/web`) e `apps/api` + `postgres` sobem via Docker Compose (`docker compose up -d --build api`).

## CI

```mermaid
flowchart LR
    GH["GitHub<br/>(push em dev/master ou PR para master)"] --> CI["GitHub Actions (ci)"]
    CI --> S0["Install + prisma generate"]
    S0 --> S1["Lint + typecheck"]
    S1 --> S2["Testes unitários"]
    S2 --> S3["Integração (Postgres)"]
    S3 --> S4["Build"]
    GH -->|"checks verdes na master"| VERCEL["Vercel (apps/web)"]
```

- Workflow em [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
- Proteções da `master`: [branches.md](branches.md).
