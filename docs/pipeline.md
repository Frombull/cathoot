# Pipeline (Jenkins)

## Estágios

Implementados no [`Jenkinsfile`](../Jenkinsfile):

1. **Install**: `pnpm install --frozen-lockfile`.
2. **Lint + types**: `pnpm lint` e `pnpm typecheck` (`next typegen && tsc --noEmit` no web).
3. **Testes unitários**: `pnpm test`. Com `CI=true` o Vitest também escreve `apps/*/test-results/junit.xml`, e o step `junit` publica o relatório no Jenkins (precisa do plugin `junit` no `plugins.txt`).
4. **Build**: `pnpm build`.
5. **Docker**: `docker compose build` e `docker compose up -d --wait`. O `--wait` só retorna quando o healthcheck passa, então serve de smoke test da imagem. No fim, `down --rmi local` limpa tudo.

Os scripts da raiz (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) rodam com `pnpm -r`: cada pacote entra nos estágios sozinho se tiver o script, e o `pnpm` pula quem não tem (o `web` ainda não tem `test`).

Os próximos estágios (integração, E2E e deploy) estão no [roadmap](roadmap.md).

## Jenkins local (Docker Compose)

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
- Cada build usa um projeto do compose próprio (`COMPOSE_PROJECT_NAME`) e porta aleatória (`WEB_PORT=0`), então builds de branches diferentes não colidem.

## GitHub

- Multibranch Pipeline descobre todas as branches com `Jenkinsfile` (`dev`, `master` e as de feature).
- **Sem webhook**: o GitHub não alcança o `localhost`. O Jenkins verifica o repositório a cada minuto (*periodic scan*). Para webhook de verdade, expor o Jenkins com ngrok ou smee.io.
- O token (fine-grained, só este repo) precisa de *Contents: read*, *Metadata: read* e *Commit statuses: read and write*.
- O Jenkins devolve o status `continuous-integration/jenkins/branch` no commit.
- Esse status é check obrigatório da `master` (ver [branches.md](branches.md)).
