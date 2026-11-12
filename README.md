# Cathoot

O Kahoot de crimes de gato: a turma vota se cada gato é **Culpado** ou **Inocente** pelo crime cometido.

Projeto de **S107 - Gerência de Configuração e Evolução de Software**.

## Stack

- **Frontend:** Next.js + shadcn/ui
- **Backend:** NestJS + Prisma
- **Banco de dados:** PostgreSQL
- **Infra local:** Docker Compose
- **Testes E2E:** Playwright
- **Teste de carga:** k6
- **Deploy:** Vercel
- **CI/CD:** Jenkins

## Como rodar

```bash
pnpm install
pnpm generate                       # gera o client do Prisma (depois do install)
pnpm --filter api dev               # API em http://localhost:3001 (precisa de DATABASE_URL e PRESENTER_PASSWORD)
pnpm --filter web dev               # front em http://localhost:3000 (repassa /api para a API acima)
pnpm test                           # testes unitários de todos os pacotes
pnpm test:coverage                  # os mesmos, com cobertura (falha abaixo de 90%; HTML em apps/*/coverage/)
pnpm --filter api test:integration  # testes da API contra o Postgres (DATABASE_URL)

docker compose up -d --build                  # aplicação completa em containers (web, api e postgres)
docker compose --profile e2e run --rm e2e     # testes E2E (Playwright) contra a aplicação no ar
docker compose --profile load run --rm load   # teste de carga (k6): 60 alunos votando ao mesmo tempo
```

A senha do apresentador no compose é `miau` (mude com `PRESENTER_PASSWORD` no `.env`). Endpoints da API em [docs/api.md](docs/api.md).

## Como jogar

1. O apresentador abre **Criar sala**, digita a senha e projeta o telão. Para o QR code funcionar nos celulares, abra pelo IP do notebook na rede (ex.: `http://192.168.0.10:3000`), não por `localhost`.
2. A turma escaneia o QR (ou digita o código na página inicial) e escolhe um nome.
3. **Começar julgamento** mostra o primeiro gato; cada um vota **Culpado** ou **Inocente** no celular.
4. **Revelar veredito** mostra o placar (empate solta o gato) e **Próximo gato** segue. No fim, o resumo com a Prisão da Soneca.

## Jenkins local

Sobe junto com o app, no mesmo `docker compose up -d`, se o perfil `jenkins` estiver ligado:

```bash
cp .env.example .env                   # liga o perfil jenkins
cp jenkins/.env.example jenkins/.env   # preencher senha, token do GitHub e NOTIFY_EMAIL
docker compose up -d --build
```

Abre em <http://localhost:8080> (usuário `admin`), já com o job `cathoot` criado. Sem esses `.env`, o compose sobe só o app.

Cada build testa com cobertura mínima de 90%, guarda os pacotes e os relatórios como artefatos e manda um e-mail com o resultado para o endereço em `NOTIFY_EMAIL`. Por padrão o e-mail cai no Mailpit, um SMTP de teste que sobe junto com o Jenkins, e aparece em <http://localhost:8025>. Detalhes em [docs/pipeline.md](docs/pipeline.md).

## Uso de IA

O projeto usou IA de forma declarada, como a disciplina pede.

**Modelos** (todos pelo Claude Code, com esforço de raciocínio *high*):

- Claude Sonnet 5.5
- Claude Opus 5.5
- Claude Fable 5.2

**Para que foram usados:** geração e revisão de código (API, telas), testes (unitários, integração, E2E e carga), Dockerfiles, `docker-compose.yml`, `Jenkinsfile` e a configuração do Jenkins, documentação em `docs/` e debugging. As regras que o Claude Code segue estão em [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md).

**Dinâmica de uso:** a IA foi usada pelo Marco, individualmente, com a conversa no terminal ou no VS Code. Ele pedia a mudança, o modelo propunha e implementava, e ele revisava o resultado antes de fazer o commit. Os commits só saem quando ele pede.

**A completar** (o professor exige, e é melhor preencher com fatos do que com texto genérico):

- [ ] Pelo menos 3 exemplos reais de prompts, dizendo o que foi aceito, ajustado ou descartado
- [ ] O que foi feito à mão, sem IA (por exemplo, as fotos do catálogo)
- [ ] O uso de IA dos demais integrantes do grupo, se houver

#### Marco Di Toro | 150 | GES