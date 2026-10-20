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
- [ ] Prisma
- [ ] `apps/api/Dockerfile` (multi-stage, como o do web)
- [ ] Serviços `api` e `postgres` no `docker-compose.yml` (volume + healthcheck + `depends_on`), para `docker compose up --build` subir tudo
- [ ] `.env.example` com as variáveis (banco, senha do apresentador)
- [ ] Modelo de dados: `Session`, `Cat`, `Participant`, `Vote`
- [x] Vitest configurado + estágio **Testes unitários** no Jenkinsfile

## 3. Regras de negócio

Ver [regras-de-negocio.md](regras-de-negocio.md). Testes primeiro.

- [ ] Máquina de estados da sessão (`LOBBY → VOTANDO → RESULTADO → … → FIM`)
- [ ] Voto único e imutável, nome único na sessão
- [ ] Veredito ao atingir o limite de votos e "Prisão da Soneca"
- [ ] Endpoints REST (sessão, gatos, participantes, votos)
- [ ] Estágio **Integração** (testes da API contra Postgres no Compose)

## 4. Telas (`apps/web`)

Ver [visual.md](visual.md) e [visao.md](visao.md).

- [x] Escolher fontes e temas claro/escuro
- [x] Landing page (`/`): botão "Criar sala" e campo de código da sala (só front; `/criar` e `/entrar` ainda não existem)
- [ ] Tela `/criar` (senha do apresentador) e `/entrar` (código + nome)
- [ ] Instalar shadcn/ui
- [ ] Vitest no `web` + estágio **Testes unitários**
- [ ] Apresentador: senha, criar sessão, QR code, "Próximo" e "Revelar"
- [ ] Aluno: entrar com nome, votar, ver o veredito
- [ ] Polling (~1,5 s) para atualizar as telas
- [ ] Resumo final (gato mais culpado etc.)

## 5. E2E

- [ ] Playwright com dois navegadores (apresentador + aluno): cadastrar gato → votar → ver o veredito
- [ ] Estágio **E2E** no Jenkins com relatório HTML/JUnit publicado

## 6. Deploy e fechamento

- [ ] Decidir onde a API roda (a Vercel só cobre o front). Opção simples: tudo no notebook com `docker compose up`
- [ ] Estágio **Deploy** (só `master`)
- [ ] Teste de carga simples (ex.: k6) para a votação com a turma toda
- [ ] Ensaio da apresentação

## Opcionais

Só se a disciplina pedir: SonarQube, Trivy, Prettier, webhook do GitHub. Ver [ideias.md](ideias.md).
