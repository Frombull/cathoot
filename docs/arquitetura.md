## Aplicação

```mermaid
flowchart LR
    APR["Apresentador<br/>(senha + QR code)"]
    ALU["Alunos<br/>(entram pelo QR, só nome)"]
    WEB["apps/web<br/>Next.js + shadcn/ui"]
    API["apps/api (virá depois)<br/>NestJS + Prisma"]
    DB[("PostgreSQL")]

    APR --> WEB
    ALU --> WEB
    WEB -. "polling ~1,5 s" .-> API
    API --> DB
```

- A API concentra as regras de negócio (estados da sessão, voto único) e expõe REST para sessão, gatos, participantes e votos.
- Tempo real por **polling**, sem WebSocket.
- Identidade do aluno: nome + cookie anônimo.
- Banco: PostgreSQL hospedado (Neon / Vercel Postgres); em dev local, via Docker Compose.
- Hospedagem da API: a definir. O front vai na Vercel com Root Directory `apps/web`.

## Pipeline CI/CD

```mermaid
flowchart LR
    GH["GitHub<br/>(commit na dev / PR para master)"] -->|"webhook"| JK["Jenkins<br/>Multibranch Pipeline"]

    subgraph Stages["Estágios do Jenkinsfile"]
        direction LR
        S0["Install"] --> S1["Lint + types"] --> S2["Testes unitários"] --> S3["Build"] --> S4["Integração<br/>(Postgres)"] --> S5["E2E Playwright"] --> S6["Deploy<br/>(só master)"]
    end

    JK --> S0
    S6 --> VERCEL["Vercel"]
    JK -->|"status do build"| GH
```

- Os estágios seguem a ordem prevista em [pipeline.md](pipeline.md).
- Install = checkout + `corepack enable` + `pnpm install --frozen-lockfile`. Integração sobe o Postgres no Docker Compose. O E2E cobre apresentador + aluno.
- O Jenkins devolve ao GitHub o status `continuous-integration/jenkins/branch`. A `master` só aceita PR com os checks `Vercel` e (quando existir) o do Jenkins passando, conforme [branches.md](branches.md).
- O `ignoreCommand` em `apps/web/vercel.json` evita deploy quando só mudam arquivos `.md` ou fora de `apps/web`.
- Se o deploy será disparado pelo Jenkins (Vercel CLI) ou só pela integração Git da Vercel: a definir.
