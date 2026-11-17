# Roadmap

Plano geral das etapas do projeto. Marcar como feito (`[x]`) ao concluir.

## 1. Base e CI

- [x] Docker Compose do app (`docker-compose.yml`, `apps/web/Dockerfile`)
- [x] CI com lint, typecheck, testes unitários, integração e build (GitHub Actions)
- [ ] Atualizar check obrigatório da `master` para `ci` no GitHub

## 2. API (`apps/api`)

- [x] Esqueleto NestJS (`GET /health`)
- [x] Prisma 7 com adaptador `pg` e migrations em `apps/api/prisma/`
- [x] `apps/api/Dockerfile` (multi-stage, aplica as migrations ao subir)
- [x] Serviços `api` e `postgres` no `docker-compose.yml` (volume + healthcheck + `depends_on`)
- [x] `.env.example` com as variáveis (banco, senha do apresentador, bind/portas)
- [x] Modelo de dados: uma tabela `Session` com o snapshot da sala (ver [regras-de-negocio.md](regras-de-negocio.md))
- [x] Testes unitários com Vitest

## 3. Regras de negócio

Ver [regras-de-negocio.md](regras-de-negocio.md).

- [x] Máquina de estados da sessão (`LOBBY → VOTANDO → RESULTADO → … → FIM`), em memória
- [x] Voto único e imutável, nome único na sessão
- [x] Veredito por maioria (empate absolve) e "Prisão da Soneca"
- [x] Validação do gato e geração do código da sala
- [x] Catálogo de gatos em arquivos (`apps/api/catalog/`: `gatos.yaml` + `<id>.jpg|png`) com leitura validada por testes
- [ ] Trocar as fotos provisórias do catálogo pelos memes de verdade
- [x] Servir as imagens em `/cats/<arquivo>` e `GET /cats`; o Dockerfile da API copia `catalog/`
- [x] Endpoints REST (sessão, participantes, votos e ações do apresentador), ver [api.md](api.md)
- [x] Testes de integração contra Postgres

## 4. Telas (`apps/web`)

Ver [visual.md](visual.md) e [visao.md](visao.md).

- [x] Escolher fontes e temas claro/escuro
- [x] Landing page (`/`): botão "Criar sala" e campo de código da sala
- [x] Tela `/criar` (senha do apresentador) e `/entrar` (código + nome)
- [x] Instalar shadcn/ui (`button`, `input`, `label`)
- [x] Testes unitários com Vitest + Testing Library + jsdom
- [x] Apresentador (`/sala/<código>/apresentador`): QR code, "Começar", "Revelar" e "Próximo"
- [x] Aluno (`/sala/<código>`): entrar com nome, votar, ver o veredito
- [x] Polling (~1,5 s) para atualizar as telas
- [x] Resumo final (gato mais culpado e Prisão da Soneca)
- [x] Rewrite do Next de `/api/*` e `/cats/*` para a API

## 5. E2E e carga

- [x] Playwright com dois navegadores (apresentador + aluno): criar sala → entrar → votar → ver o veredito, e o jogo inteiro até o resumo (`e2e/`)
- [x] Teste de carga (k6) para a votação com a turma toda (`load/`)

## 6. Deploy em produção

- [x] Frontend na Vercel (`https://cathoot.com.br`)
- [ ] Subir o backend (`docker compose up -d --build api`) no servidor e apontar `API_URL` na Vercel
