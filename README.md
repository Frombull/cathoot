# Cathoot

[![CI](https://github.com/Frombull/cathoot/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Frombull/cathoot/actions/workflows/ci.yml)

O Kahoot de crimes de gato, um.. tribumiau!!!1!

## Funcionalidades

- **Sala com QR code:** o apresentador cria a sala com uma senha e projeta o telão com o QR code e o código curto da sala (6 caracteres, sem 0/O nem 1/I, que se confundem).
- **Entrada sem cadastro:** cada aluno entra pelo celular só com o nome, único na sala. Recarregar a página volta para a mesma pessoa.
- **Votação:** para cada gato (foto, nome e crime), cada aluno vota **Culpado** ou **Inocente**, uma vez e sem trocar. O telão mostra quantos já votaram.
- **Veredito:** o apresentador revela o placar. Culpado só com maioria; empate ou nenhum voto solta o gato.
- **Resumo final:** o gato mais culpado e a **Prisão da Soneca**, com todos os condenados.
- **Catálogo em arquivos:** os gatos ficam em `apps/api/catalog/` (`gatos.yaml` com nome e crime, mais uma imagem por gato), validados por teste.
- **Aguenta reinício:** a sala é gravada no Postgres a cada ação, e a API a recupera se reiniciar no meio do jogo.
- **Tema claro e escuro**, com uma animação diferente a cada troca.

## Stack

- **Frontend:** Next.js + shadcn/ui (hospedado na Vercel)
- **Backend:** NestJS + Prisma
- **Banco de dados:** PostgreSQL
- **Infra:** Docker Compose
- **Testes:** Vitest, Playwright (E2E) e k6 (carga)
- **CI:** GitHub Actions

## Instalação e execução

**Pré-requisitos:**

- Para rodar tudo em containers: **Docker** com o **Compose v2**.
- Para desenvolver fora do Docker: **Node 22 ou mais novo** (as imagens usam o 24) e **pnpm 11**. Até o Node 24, `corepack enable` instala a versão certa do pnpm; a partir do 25, instale o pnpm à parte. Só pnpm: o projeto recusa `npm` e `yarn`.

```bash
git clone https://github.com/Frombull/cathoot.git && cd cathoot
docker compose up -d --build        # app completo em http://localhost:3000
```

Para desenvolver localmente:

```bash
pnpm install
pnpm generate                       # gera o client do Prisma (depois do install)
pnpm --filter api dev               # API em http://localhost:3001 (precisa de DATABASE_URL e PRESENTER_PASSWORD)
pnpm --filter web dev               # front em http://localhost:3000 (repassa /api para a API acima)
pnpm test                           # testes unitários de todos os pacotes
pnpm test:coverage                  # os mesmos, com cobertura (HTML em apps/*/coverage/)
pnpm --filter api test:integration  # testes da API contra o Postgres (DATABASE_URL)

docker compose up -d --build                  # aplicação completa em containers (web, api e postgres)
docker compose --profile e2e run --rm e2e     # testes E2E (Playwright) contra a aplicação no ar
docker compose --profile load run --rm load   # teste de carga (k6): 60 alunos votando ao mesmo tempo
```

A senha padrão do apresentador no compose é `miau` (mude com `PRESENTER_PASSWORD` no `.env`). Endpoints da API em [docs/api.md](docs/api.md).

## Como jogar

1. O apresentador abre **Criar sala**, digita a senha e projeta o telão. Para o QR code funcionar nos celulares localmente, abra pelo IP do computador na rede (ex.: `http://192.168.0.10:3000`), não por `localhost`.
2. A turma escaneia o QR (ou digita o código na página inicial) e escolhe um nome.
3. **Começar julgamento** mostra o primeiro gato; cada um vota **Culpado** ou **Inocente** no celular.
4. **Revelar veredito** mostra o placar (empate solta o gato) e **Próximo gato** segue. No fim, o resumo com a Prisão da Soneca.

## Hospedagem do backend

Com o frontend na Vercel (`apps/web`), o servidor só precisa subir o Postgres e a API:

```bash
cp .env.example .env
# ajuste PRESENTER_PASSWORD, POSTGRES_PASSWORD e (se usar reverse proxy local) API_BIND=127.0.0.1
docker compose up -d --build api
```

Na Vercel, configure `API_URL` apontando para o endereço público da API (ex.: `https://api.seu-dominio.com`) e faça um novo deploy — os rewrites do Next (`/api/*` e `/cats/*`) leem essa variável no build.
