# Pipeline (Jenkins)

## Estágios

Implementados no [`Jenkinsfile`](../Jenkinsfile):

1. **Install**: apaga os relatórios e pacotes do build anterior (o workspace é reaproveitado, e um estágio que não rodou deixaria um relatório velho para os artefatos e o e-mail), depois `pnpm install --frozen-lockfile` e `pnpm generate` (gera o client do Prisma, de que o lint, os tipos e o build dependem).
2. **Lint + types**: `pnpm lint` e `pnpm typecheck` (`next typegen && tsc --noEmit` no web).
3. **Testes unitários**: `pnpm test:coverage` (Vitest com `--coverage`, provider V8). Com `CI=true` o Vitest também escreve `apps/*/test-results/junit.xml`, e o step `junit` publica o relatório no Jenkins (precisa do plugin `junit` no `plugins.txt`). A cobertura tem **mínimo de 90%** em linhas, ramos, funções e statements (`thresholds` em `apps/api/vitest.config.ts` e `apps/web/vitest.config.mts`): abaixo disso o comando falha e o estágio fica vermelho. O `publishHTML` publica o relatório de cada app (**Cobertura API** e **Cobertura web**). Ver [Cobertura](#cobertura).
4. **Integração**: sobe só o `postgres` do compose, aplica as migrations (`prisma migrate deploy`) e roda `pnpm --filter api test:integration --coverage` (`*.integration.spec.ts`), com relatório JUnit e a **Cobertura integração** (também com mínimo de 90%). Como o Jenkins roda em container, ele entra na rede do compose (`docker network connect`) para alcançar o Postgres pelo nome do serviço; no `cleanup` sai da rede antes do `compose down`.
5. **Build + pacote**: `pnpm build` e [`ci/empacotar.sh`](../ci/empacotar.sh), que gera `pacotes/cathoot-api-<build>.tgz` (o `dist/` da API com as migrations e o catálogo) e `pacotes/cathoot-web-<build>.tgz` (a saída *standalone* do Next, que roda com `node apps/web/server.js`). O `archiveArtifacts` guarda os dois como artefatos do build, com `fingerprint` (o Jenkins anota o hash de cada pacote para rastrear de que build ele veio).
6. **Docker**: `docker compose build` e `docker compose up -d --wait` (Postgres, API e web). O `--wait` só retorna quando todos os healthchecks passam, então serve de smoke test das imagens e das migrations. O healthcheck do `web` também chama `/api/health` através do rewrite do Next, o que confere o caminho web → API. A aplicação fica no ar para o próximo estágio.
7. **E2E**: `docker compose --profile e2e run e2e` roda o Playwright num container (imagem oficial do Playwright, `e2e/Dockerfile`) dentro da rede do compose, contra `http://web:3000`. Como o `jenkins_home` é um volume, não dá para montar o workspace no container: os relatórios saem com `docker cp` depois que ele termina. O step `junit` publica `e2e/test-results/junit.xml` e o `publishHTML` (plugin `htmlpublisher`) publica o relatório HTML do Playwright, com trace e screenshot dos testes que falham.

8. **Carga**: `docker compose --profile load run load` roda o k6 num container (`load/Dockerfile`), também contra `http://web:3000`, com 60 alunos numa sala só (ver [decisoes-tecnicas.md](decisoes-tecnicas.md)). Os limites (*thresholds*) do `load/votacao.js` reprovam o estágio (o k6 sai com código 99). Os relatórios saem com `docker cp`, como no E2E: o `junit` publica um caso por limite e o `publishHTML` publica o relatório HTML do k6.
9. **Docker Hub** (só na `master`): publica a imagem do Jenkins no Docker Hub com [`ci/publicar-jenkins.sh`](../ci/publicar-jenkins.sh). É a entrega contínua do projeto: só chega aqui o que passou em todos os estágios anteriores. Pulado se o Jenkins não tiver a conta do Docker Hub. Ver [Docker Hub](#docker-hub).

No fim do pipeline, passando ou falhando:

- **Artefatos** (`post { always }`): o `archiveArtifacts` guarda os relatórios de todos os testes que rodaram (JUnit, cobertura, Playwright e k6). Junto com os pacotes do estágio Build, ficam em *Build Artifacts* na página do build. O `buildDiscarder` mantém o histórico dos últimos 20 builds e os artefatos só dos últimos 5.
- **Notificação por e-mail** (`post { always }`): [`ci/notificar-email.sh`](../ci/notificar-email.sh) manda o resultado do build, com a quantidade de testes e falhas de cada estágio, a cobertura e os links do build, dos testes e dos artefatos. Ver [E-mail](#e-mail).
- **Limpeza** (`post { cleanup }`): `docker compose --profile e2e --profile load down --volumes --rmi local` derruba tudo.

### Cobertura

- **O que conta:** o código em `apps/api/src` e `apps/web/src`, exceto os próprios testes e o que é gerado ou só faz o *bootstrap*. Ficam de fora o client gerado pelo Prisma (`src/generated/`), o `main.ts` da API (3 linhas que sobem o Nest), o `layout.tsx` do web (o `<html>` com as fontes, que não monta no jsdom e o E2E cobre) e os helpers de teste (`*.contract.ts`, `src/test/`).
- **Integração:** o acesso ao Postgres (`src/prisma/` e `prisma-session-repository.ts`) não roda sem banco. Por isso ele fica fora da cobertura dos unitários e entra na da integração (`vitest.integration.config.ts`), que mede só esses arquivos. Cada suíte responde pela sua parte, e as duas têm mínimo de 90%.
- **Local:** `pnpm test:coverage` mostra a tabela no terminal e gera o HTML em `apps/*/coverage/index.html`.

### E-mail

- **Destinatário:** o endereço vem de `NOTIFY_EMAIL`, uma variável de ambiente do container do Jenkins (definida no `jenkins/.env`, que não vai para o git), e nunca fica fixo no código. Sem ela, o script avisa no log e não manda nada.
- **SMTP:** por padrão o e-mail vai para o **Mailpit** (`smtp://mailpit:1025`), um SMTP de teste que sobe junto com o Jenkins (imagem `axllent/mailpit` do Docker Hub) e mostra os e-mails numa caixa de entrada em <http://localhost:8025>. Para mandar de verdade, aponte `SMTP_URL`, `SMTP_USER` e `SMTP_PASSWORD` para um SMTP real (exemplo do Gmail no `jenkins/.env.example`).
- **Como envia:** o script monta a mensagem e manda com o `curl`, que fala SMTP e já está na imagem do Jenkins, então não precisa instalar nada.
- **Por que no `post`:** um estágio normal seria pulado quando outro falha, e o aviso de falha é o mais importante. Um erro no envio deixa o build instável (amarelo) em vez de reprovar um build que passou (`catchError`).

### Docker Hub

- **O que publica:** a imagem do Jenkins (`jenkins/Dockerfile`), como `<usuário>/cathoot-jenkins`, com as tags `latest` e o número do build. Assim o compose de outra máquina baixa o Jenkins pronto, com os plugins, o Node e o Docker CLI, e roda o pipeline completo.
- **Arquitetura:** a imagem é arm64 (`docker build --platform linux/arm64`), porque o notebook e o computador do professor são Mac com Apple Silicon. O build é nativo, sem emulação. Para rodar num PC amd64, seria preciso gerar as duas arquiteturas com `docker buildx build --platform linux/amd64,linux/arm64 --push`.
- **Credencial:** `DOCKERHUB_USER` e `DOCKERHUB_TOKEN` no `jenkins/.env` viram a credencial `dockerhub` pelo `casc.yaml`. O estágio faz o `docker login` com ela (o Jenkins esconde o token no log) e o `docker logout` no fim, para o login não ficar salvo no `jenkins_home`. Sem `DOCKERHUB_USER`, o estágio é pulado.
- **À mão:** `docker login` e `DOCKERHUB_USER=<usuário> ci/publicar-jenkins.sh`. Para só testar o build, sem publicar: `PUBLICAR=0`.

Os scripts da raiz (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm build`) rodam com `pnpm -r`: cada pacote entra nos estágios sozinho se tiver o script, e o `pnpm` pula quem não tem. O pacote `e2e` tem `typecheck`, mas o script dos testes se chama `e2e` (não `test`) justamente para o Playwright não rodar no estágio de testes unitários.

Os relatórios do Playwright e do k6 são apps em JavaScript, e a CSP padrão do Jenkins deixaria a página em branco. Por isso o `jenkins/Dockerfile` relaxa a CSP (`hudson.model.DirectoryBrowserSupport.CSP`), o que só é aceitável num Jenkins local. Mudou o `plugins.txt` ou o `Dockerfile` do Jenkins: `docker compose up -d --build jenkins`.

O deploy do app ainda está em aberto no [roadmap](roadmap.md).

## Jenkins local (Docker Compose)

O professor proibiu o GitHub Actions: o GitHub só guarda o código e o Jenkins faz todo o CI/CD. Por isso o Jenkins roda no notebook, em container, configurado por código. Em produção real ele ficaria num servidor sempre ligado, com webhook e agentes separados. Ponto em aberto: a Vercel também faz deploy automático pela integração com o Git; perguntar ao professor se isso vale ou se o deploy deve ir para um estágio do Jenkins (ver [arquitetura.md](arquitetura.md)).

Tudo em [`jenkins/`](../jenkins/), configurado como código:

- `Dockerfile`: Jenkins LTS + Node 24 (pnpm via `corepack enable`) + Docker CLI com compose e buildx.
- `plugins.txt`: plugins instalados no build da imagem.
- `casc.yaml` (Configuration as Code): usuário `admin`, credenciais do GitHub e do Docker Hub e o job Multibranch `cathoot` (via Job DSL). Mudanças feitas pela UI se perdem no restart.
- `docker-compose.yml`: os serviços do Jenkins e do Mailpit, incluídos pelo compose da raiz (`include`). O Jenkins usa a porta 8080, com o socket do Docker do host montado (os builds usam o Docker do host). O Mailpit usa a porta 8025 e guarda os e-mails no volume `mailpit_data`.

```bash
cp .env.example .env                   # COMPOSE_PROFILES=jenkins
cp jenkins/.env.example jenkins/.env   # preencher senha, token do GitHub e NOTIFY_EMAIL
docker compose up -d --build           # sobe o app, o Jenkins e o Mailpit
# http://localhost:8080 (usuário admin) e e-mails em http://localhost:8025
```

Os dois serviços têm `profiles: ["jenkins"]`: só sobem se `COMPOSE_PROFILES=jenkins` (no `.env` da raiz) ou `--profile jenkins`. Isso é essencial para o CI: dentro do Jenkins não há `.env`, então o `docker compose` dos builds ignora esses serviços e nunca tenta subir outro Jenkins.

- Os builds rodam no próprio controller (`agent any`), sem agentes separados.
- Cada build usa um projeto do compose próprio (`COMPOSE_PROJECT_NAME`) e portas aleatórias (`WEB_PORT=0`, `API_PORT=0`, `POSTGRES_PORT=0`), então builds de branches diferentes não colidem.

## GitHub

- Multibranch Pipeline descobre todas as branches com `Jenkinsfile` (`dev`, `master` e as de feature).
- **Sem webhook**: o GitHub não alcança o `localhost`. O Jenkins verifica o repositório a cada minuto (*periodic scan*). Para webhook de verdade, expor o Jenkins com ngrok ou smee.io.
- O token (fine-grained, só este repo) precisa de *Contents: read*, *Metadata: read* e *Commit statuses: read and write*.
- O Jenkins devolve o status `continuous-integration/jenkins/branch` no commit.
- Esse status é check obrigatório da `master` (ver [branches.md](branches.md)).
