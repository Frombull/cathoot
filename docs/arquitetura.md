# Arquitetura

## Aplicação

```mermaid
flowchart LR
    APR["Apresentador<br/>(senha + QR code)"]
    ALU["Alunos<br/>(QR ou código da sala, só nome)"]
    WEB["apps/web<br/>Next.js + shadcn/ui"]
    API["apps/api<br/>NestJS + Prisma"]
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
- Banco: PostgreSQL. A sala vive em memória na API e é gravada no banco a cada ação (snapshot), então sobrevive a um reinício. Hoje roda no Docker Compose; hospedado (Neon / Vercel Postgres) só se a API sair do notebook.
- Hospedagem da API: a definir. O front vai na Vercel com Root Directory `apps/web`.

## Pipeline CI/CD

```mermaid
flowchart LR
    GH["GitHub<br/>(commit na dev / PR para master)"] -->|"periodic scan (1 min)"| JK["Jenkins local<br/>(Docker Compose)<br/>Multibranch Pipeline"]

    subgraph Stages["Estágios do Jenkinsfile"]
        direction LR
        S0["Install"] --> S1["Lint + types"] --> S2["Testes unitários"] --> S4["Integração<br/>(Postgres)"] --> S3["Build"] --> SD["Docker<br/>(compose build + smoke)"] --> S5["E2E Playwright<br/>(container na rede do compose)"] --> S6["Deploy<br/>(só master)"]
    end

    JK --> S0
    S6 --> VERCEL["Vercel"]
    JK -->|"status do build"| GH
    GH -->|"Vercel + Jenkins verdes<br/>e branch atualizada"| MASTER["Merge do PR na master"]
    MASTER --> S6
```

- Estágios, Jenkins local e integração com o GitHub: [pipeline.md](pipeline.md). Proteções da `master`: [branches.md](branches.md).
- Quem dispara o deploy (Jenkins com Vercel CLI ou só a integração Git da Vercel): a definir.
