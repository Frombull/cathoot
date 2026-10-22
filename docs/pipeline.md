# Pipeline (Jenkins)

## Estágios

Implementados no [`Jenkinsfile`](../Jenkinsfile):

1. **Install**: `pnpm install --frozen-lockfile` e `pnpm generate` (gera o client do Prisma, de que o lint, os tipos e o build dependem).
2. **Lint + types**: `pnpm lint` e `pnpm typecheck` (`next typegen && tsc --noEmit` no web).
3. **Testes unitários**: `pnpm test`. Com `CI=true` o Vitest também escreve `apps/*/test-results/junit.xml`, e o step `junit` publica o relatório no Jenkins (precisa do plugin `junit` no `plugins.txt`).
4. **Integração**: sobe só o `postgres` do compose, aplica as migrations (`prisma migrate deploy`) e roda `pnpm --filter api test:integration` (`*.integration.spec.ts`), com relatório JUnit. Como o Jenkins roda em container, ele entra na rede do compose (`docker network connect`) para alcançar o Postgres pelo nome do serviço; no `cleanup` sai da rede antes do `compose down`.
5. **Build**: `pnpm build`.
6. **Docker**: `docker compose build` e `docker compose up -d --wait` (Postgres, API e web). O `--wait` só retorna quando todos os healthchecks passam, então serve de smoke test das imagens e das migrations. O healthcheck do `web` também chama `/api/health` através do rewrite do Next, o que confere o caminho web → API. A aplicação fica no ar para o próximo estágio.
7. **E2E**: `docker compose --profile e2e run e2e` roda o Playwright num container (imagem oficial do Playwright, `e2e/Dockerfile`) dentro da rede do compose, contra `http://web:3000`. Como o `jenkins_home` é um volume, não dá para montar o workspace no container: os relatórios saem com `docker cp` depois que ele termina. O step `junit` publica `e2e/test-results/junit.xml` e o `publishHTML` (plugin `htmlpublisher`) publica o relatório HTML do Playwright, com trace e screenshot dos testes que falham.

8. **Carga**: `docker compose --profile load run load` roda o k6 num container (`load/Dockerfile`), também contra `http://web:3000`, com 60 alunos numa sala só (ver [decisoes-tecnicas.md](decisoes-tecnicas.md)). Os limites (*thresholds*) do `load/votacao.js` reprovam o estágio (o k6 sai com código 99). Os relatórios saem com `docker cp`, como no E2E: o `junit` publica um caso por limite e o `publishHTML` publica o relatório HTML do k6.

No fim do pipeline (`post { cleanup }`), `docker compose --profile e2e --profile load down --volumes --rmi local` derruba tudo.

Os scripts da raiz (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) rodam com `pnpm -r`: cada pacote entra nos estágios sozinho se tiver o script, e o `pnpm` pula quem não tem. O pacote `e2e` tem `typecheck`, mas o script dos testes se chama `e2e` (não `test`) justamente para o Playwright não rodar no estágio de testes unitários.

Os relatórios do Playwright e do k6 são apps em JavaScript, e a CSP padrão do Jenkins deixaria a página em branco. Por isso o `jenkins/Dockerfile` relaxa a CSP (`hudson.model.DirectoryBrowserSupport.CSP`), o que só é aceitável num Jenkins local. Mudou o `plugins.txt` ou o `Dockerfile` do Jenkins: `docker compose up -d --build jenkins`.

O próximo estágio (deploy) está no [roadmap](roadmap.md).

## Jenkins local (Docker Compose)

O professor proibiu o GitHub Actions: o GitHub só guarda o código e o Jenkins faz todo o CI/CD. Por isso o Jenkins roda no notebook, em container, configurado por código. Em produção real ele ficaria num servidor sempre ligado, com webhook e agentes separados. Ponto em aberto: a Vercel também faz deploy automático pela integração com o Git; perguntar ao professor se isso vale ou se o deploy deve ir para um estágio do Jenkins (ver [arquitetura.md](arquitetura.md)).

Tudo em [`jenkins/`](../jenkins/), configurado como código:

- `Dockerfile`: Jenkins LTS + Node 24 (pnpm via `corepack enable`) + Docker CLI com compose e buildx.
- `plugins.txt`: plugins instalados no build da imagem.
- `casc.yaml` (Configuration as Code): usuário `admin`, credencial do GitHub e o job Multibranch `cathoot` (via Job DSL). Mudanças feitas pela UI se perdem no restart.
- `docker-compose.yml`: o serviço do Jenkins, incluído pelo compose da raiz (`include`). Porta 8080, com o socket do Docker do host montado (os builds usam o Docker do host).

```bash
cp .env.example .env                   # COMPOSE_PROFILES=jenkins
cp jenkins/.env.example jenkins/.env   # preencher senha e token do GitHub
docker compose up -d --build           # sobe o app e o Jenkins
# http://localhost:8080 (usuário admin)
```

O serviço tem `profiles: ["jenkins"]`: só sobe se `COMPOSE_PROFILES=jenkins` (no `.env` da raiz) ou `--profile jenkins`. Isso é essencial para o CI: dentro do Jenkins não há `.env`, então o `docker compose` dos builds ignora o serviço e nunca tenta subir outro Jenkins.

- Os builds rodam no próprio controller (`agent any`), sem agentes separados.
- Cada build usa um projeto do compose próprio (`COMPOSE_PROJECT_NAME`) e portas aleatórias (`WEB_PORT=0`, `API_PORT=0`, `POSTGRES_PORT=0`), então builds de branches diferentes não colidem.

## GitHub

- Multibranch Pipeline descobre todas as branches com `Jenkinsfile` (`dev`, `master` e as de feature).
- **Sem webhook**: o GitHub não alcança o `localhost`. O Jenkins verifica o repositório a cada minuto (*periodic scan*). Para webhook de verdade, expor o Jenkins com ngrok ou smee.io.
- O token (fine-grained, só este repo) precisa de *Contents: read*, *Metadata: read* e *Commit statuses: read and write*.
- O Jenkins devolve o status `continuous-integration/jenkins/branch` no commit.
- Esse status é check obrigatório da `master` (ver [branches.md](branches.md)).
