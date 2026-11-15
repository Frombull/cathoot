# Roadmap

Plano geral das próximas etapas, em ordem. Marcar como feito (`[x]`) ao concluir.

**Requisito do professor:** cada parte tem seu Dockerfile (front, back, ...) e a aplicação inteira sobe com `docker compose up --build`.

## 1. Pipeline base

- [x] Docker Compose do app (`docker-compose.yml`, `apps/web/Dockerfile`)
- [x] Jenkins local configurado por código (`jenkins/`)
- [x] `Jenkinsfile`: Install, Lint + types, Build, Docker
- [x] Push na `dev` e primeiro build verde no GitHub (token em `jenkins/.env`)
- [x] Adicionar `continuous-integration/jenkins/branch` aos checks obrigatórios da `master`

## 2. API (`apps/api`)

- [x] Esqueleto NestJS (`GET /health`)
- [x] Prisma 7 com adaptador `pg` e migrations em `apps/api/prisma/`
- [x] `apps/api/Dockerfile` (multi-stage, aplica as migrations ao subir)
- [x] Serviços `api` e `postgres` no `docker-compose.yml` (volume + healthcheck + `depends_on`), para `docker compose up --build` subir tudo
- [x] `.env.example` com as variáveis (banco, senha do apresentador)
- [x] Modelo de dados: uma tabela `Session` com o snapshot da sala (ver [regras-de-negocio.md](regras-de-negocio.md))
- [x] Vitest configurado + estágio **Testes unitários** no Jenkinsfile

## 3. Regras de negócio

Ver [regras-de-negocio.md](regras-de-negocio.md). Testes primeiro.

- [x] Máquina de estados da sessão (`LOBBY → VOTANDO → RESULTADO → … → FIM`), em memória
- [x] Voto único e imutável, nome único na sessão
- [x] Veredito por maioria (empate absolve) e "Prisão da Soneca"
- [x] Validação do gato e geração do código da sala
- [x] Catálogo de gatos em arquivos (`apps/api/catalog/`: `gatos.yaml` + `<id>.jpg|png`) com leitura validada por testes
- [ ] Trocar as fotos provisórias do catálogo pelos memes de verdade (feito por você)
- [x] Servir as imagens em `/cats/<arquivo>` e `GET /cats`; o Dockerfile da API copia `catalog/`
- [x] Endpoints REST (sessão, participantes, votos e ações do apresentador), ver [api.md](api.md)
- [x] Estágio **Integração** (testes da API contra Postgres no Compose)

## 4. Telas (`apps/web`)

Ver [visual.md](visual.md) e [visao.md](visao.md).

- [x] Escolher fontes e temas claro/escuro
- [x] Landing page (`/`): botão "Criar sala" e campo de código da sala
- [x] Tela `/criar` (senha do apresentador) e `/entrar` (código + nome)
- [x] Instalar shadcn/ui (`button`, `input`, `label`)
- [x] Vitest no `web` (Testing Library + jsdom), já pego pelo estágio **Testes unitários**
- [x] Apresentador (`/sala/<código>/apresentador`): QR code, "Começar", "Revelar" e "Próximo"
- [x] Aluno (`/sala/<código>`): entrar com nome, votar, ver o veredito
- [x] Polling (~1,5 s) para atualizar as telas
- [x] Resumo final (gato mais culpado e Prisão da Soneca)
- [x] Rewrite do Next de `/api/*` e `/cats/*` para a API

## 5. E2E

- [x] Playwright com dois navegadores (apresentador + aluno): criar sala → entrar → votar → ver o veredito, e o jogo inteiro até o resumo (`e2e/`)
- [x] Estágio **E2E** no Jenkins com relatório HTML/JUnit publicado
- [x] Primeiro build verde com os estágios E2E e Carga no Jenkins (build #8 da `dev`, em 2026-11-14: 227 testes, 0 falhas), depois de corrigir o corepack no `e2e/Dockerfile`

## 6. Deploy e fechamento

- [ ] Decidir onde a API roda (a Vercel só cobre o front). Opção simples: tudo no notebook com `docker compose up`
- [x] Estágio **Docker Hub** (só `master`): a entrega contínua publica a imagem do Jenkins (`ci/publicar-jenkins.sh`, arm64)
- [ ] Estágio de deploy do app, se a API sair do notebook
- [x] Teste de carga (k6) para a votação com a turma toda, com estágio **Carga** no Jenkins (`load/`)
- [ ] Ensaio da apresentação

## 7. Requisitos da NP2

Exigências do professor que ainda faltam (checklist completo em [requisitos-np2.md](requisitos-np2.md)).

- [x] Cobertura de testes ≥ 90%: `@vitest/coverage-v8` em `api` e `web`, limite mínimo (*thresholds*) de 90% e relatório publicado no Jenkins
- [x] Artefatos no Jenkins: `archiveArtifacts` do pacote (build) e dos relatórios de testes
- [x] Notificação por e-mail: `ci/notificar-email.sh` no `post` do Jenkinsfile, endereço em `NOTIFY_EMAIL` e o Mailpit no compose
- [x] Pôr o `NOTIFY_EMAIL` no `jenkins/.env` (ver `jenkins/.env.example`)
- [x] Recriar o Jenkins (`docker compose up -d`), para ele pegar o `NOTIFY_EMAIL` e subir o Mailpit (o e-mail do build #8 chegou no Mailpit). Recriado de novo em 2026-11-15 com a credencial do Docker Hub
- [x] Script e estágio que publicam a imagem do Jenkins (`ci/publicar-jenkins.sh` e estágio **Docker Hub**), testados num registry local
- [x] Criar a conta (`marcoditoroinatel`) e o token do Docker Hub, pôr `DOCKERHUB_USER` e `DOCKERHUB_TOKEN` no `jenkins/.env` e o link no README
- [ ] Primeira publicação da imagem: PR `dev` → `master` e build verde da `master` (estágio **Docker Hub**)
- [x] Compose subindo o Jenkins pela imagem do Docker Hub (`image:` em vez de `build: .`), mantendo `api` e `web` com Dockerfile local
- [x] Seção "Uso de IA" no README, com 6 prompts reais e o que foi aceito, ajustado ou descartado
- [ ] Conferir a lista "Feito à mão, sem IA" do README
- [ ] Commits relevantes de todos os integrantes (hoje o grupo é o Marco e um colega que ainda não contribuiu; alinhar com o professor)
- [ ] Confirmar com o professor se o repositório precisa estar no time da matéria (hoje em `Frombull/cathoot`)
- [ ] Revisar o repositório, o `Jenkinsfile` e o `docker-compose.yml` em grupo antes da defesa (Q&A, todos respondem)

## Opcionais

Só se a disciplina pedir: SonarQube, Trivy, Prettier, webhook do GitHub. Ver [ideias.md](ideias.md).
