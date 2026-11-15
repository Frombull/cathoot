# Cathoot

[![Checks da master](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2FFrombull%2Fcathoot%2Fcommits%2Fmaster%2Fstatus&query=%24.state&label=checks%20(Vercel%20%2B%20Jenkins))](https://github.com/Frombull/cathoot/commits/master)

O Kahoot de crimes de gato: a turma vota se cada gato é **Culpado** ou **Inocente** pelo crime cometido.

Projeto de **S107 - Gerência de Configuração e Evolução de Software**.

## Funcionalidades

- **Sala com QR code:** o apresentador cria a sala com uma senha e projeta o telão com o QR code e o código curto da sala (6 caracteres, sem 0/O nem 1/I, que se confundem).
- **Entrada sem cadastro:** cada aluno entra pelo celular só com o nome, único na sala. Recarregar a página volta para a mesma pessoa.
- **Votação:** para cada gato (foto, nome e crime), cada aluno vota **Culpado** ou **Inocente**, uma vez e sem trocar. O telão mostra quantos já votaram.
- **Veredito:** o apresentador revela o placar. Culpado só com maioria; empate ou nenhum voto solta o gato.
- **Resumo final:** o gato mais culpado e a **Prisão da Soneca**, com todos os condenados.
- **Catálogo em arquivos:** os gatos ficam em `apps/api/catalog/` (`gatos.yaml` com nome e crime, mais uma imagem por gato), validados por teste.
- **Aguenta reinício:** a sala é gravada no Postgres a cada ação, e a API a recupera se reiniciar no meio do jogo.
- **Tema claro e escuro**, com uma animação diferente a cada troca.

E, no pipeline do Jenkins: lint, testes com cobertura mínima de 90%, integração com o Postgres, pacotes, imagens Docker, E2E com dois navegadores, teste de carga com a turma inteira votando, e-mail com o resultado e publicação da imagem do Jenkins no Docker Hub. Detalhes em [docs/pipeline.md](docs/pipeline.md).

## Stack

- **Frontend:** Next.js + shadcn/ui
- **Backend:** NestJS + Prisma
- **Banco de dados:** PostgreSQL
- **Infra local:** Docker Compose
- **Testes E2E:** Playwright
- **Teste de carga:** k6
- **Deploy:** Vercel
- **CI/CD:** Jenkins

## Instalação e execução

**Pré-requisitos:**

- Para rodar tudo em containers: **Docker** com o **Compose v2**. Não precisa instalar mais nada.
- Para desenvolver fora do Docker: **Node 22 ou mais novo** (as imagens usam o 24) e **pnpm 11**. Até o Node 24, `corepack enable` instala a versão certa do pnpm; a partir do 25, instale o pnpm à parte. Só pnpm: o projeto recusa `npm` e `yarn`.

```bash
git clone https://github.com/Frombull/cathoot.git && cd cathoot
docker compose up -d --build        # app completo em http://localhost:3000
```

Para desenvolver:

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

### Imagem no Docker Hub

Imagem do Jenkins: **<https://hub.docker.com/r/marcoditoroinatel/cathoot-jenkins>**

Ela é gerada a partir do `jenkins/Dockerfile`, para arm64 (Mac com Apple Silicon). O compose sobe o Jenkins por ela: em outra máquina, o `docker compose up` baixa o Jenkins pronto do Docker Hub, enquanto `api` e `web` são montados pelos Dockerfiles locais. Cada build verde da `master` publica sozinho, se o `jenkins/.env` tiver `DOCKERHUB_USER` e `DOCKERHUB_TOKEN`. À mão:

```bash
docker login
DOCKERHUB_USER=<usuário> ci/publicar-jenkins.sh   # PUBLICAR=0 só gera a imagem, sem enviar
```

## Uso de IA


**Modelos**

- Claude Opus 5.5, high
- Claude Fable 5.2, extra high

**Para que foram usados:** geração e revisão de código (API, telas), testes (unitários, integração, E2E e carga), Dockerfiles, `docker-compose.yml`, `Jenkinsfile` e a configuração do Jenkins, documentação em `docs/` e debugging. As regras que o Claude Code segue estão em [CLAUDE.md](CLAUDE.md) e [AGENTS.md](AGENTS.md).

**Dinâmica de uso:** IA foi usada para pedir testes, ajuda com debug implementação de novas features e code review principalmente.

**Exemplos reais de prompts** (focados em arquitetura, segurança e boas práticas):

1. **Ajustado: diagrama de arquitetura e pipeline.**

   > Faça um diagrama Mermaid da arquitetura e do pipeline do Jenkins. Mostre a separação de rede: o Next repassando `/api` pro Nest, o Postgres isolado na rede interna do Docker sem porta exposta pro host, e os estágios do CI/CD com os testes, cobertura e build. Mantenha simples, sem inventar ambientes de nuvem.

   O primeiro diagrama separava ambientes e ficou complexo demais. Pedi para focar na nossa topologia real de containers e nos gates do pipeline, gerando a versão de [docs/arquitetura.md](docs/arquitetura.md).

2. **Ajustado: catálogo de gatos e segurança de arquivos.**

   > Para os gatos e os crimes, não quero upload nem tabela dinâmica no banco para evitar brechas de segurança. Vamos usar arquivos estáticos em `apps/api/catalog`. Modela isso em um YAML único com validação de schema no boot da API, e garanta que o endpoint de imagens proteja contra path traversal (bloquear `../`).

   A IA sugeriu um `.txt` solto por gato, o que dificultava validar a estrutura. Pedi para centralizar em um YAML único com validação e proteção no streaming de imagens, virando o [`apps/api/catalog/gatos.yaml`](apps/api/catalog/gatos.yaml).

3. **Aceito: troca de tema e acessibilidade.**

   > Quero o toggle de dark/light com View Transitions alternando entre rectangle, circle blur e blinds, mas cuidando de dois pontos: respeitar `prefers-reduced-motion` para acessibilidade e não injetar CSS inline dinâmico para não quebrar a CSP.

   Ficou implementado em `apps/web/src/components/theme-toggle.tsx`, usando a View Transitions API nativa com fallback gracioso e sem dependências pesadas.

4. **Descartado em parte: página 404 e limpeza de rotas.**

   > Limpa a página 404 (`not-found.tsx`). Erro não deve vazar header de navegação, rotas internas nem mensagem longa. Deixa minimalista: só a imagem do gato centralizada, fundo limpo e um botão simples voltando para a home.

   A IA tinha criado um header completo com links e textos desnecessários. Pedi para enxugar tudo e deixar só o gato do http.cat e o botão de voltar.

5. **Debugging: Jenkins e profiles no Docker Compose.**

   > O `docker compose up -d` subiu a aplicação mas não o Jenkins. Como ele roda montando o docker socket pra subir containers irmãos, quero isolar isso via profiles (`profiles: [jenkins]`) no compose para não poluir o dev local nem criar loops no CI. Como estruturar isso com `include`?

   O Jenkins estava em um compose à parte. A solução foi integrá-lo via `include` com profile no compose raiz, subindo o CI só quando necessário.

6. **Revisão técnica: auditoria e higiene do código.**

   > Revisa o código que você gerou: tira comentários óbvios de IA, garante que nenhuma rota logue a senha do apresentador ou tokens, e checa se os retornos da API estão com DTOs tipados sem `any`.

   Usado para enxugar os comentários desnecessários e garantir higiene de logs e tipagem estrita antes dos commits.

**Resposta descartada:** ao instalar o shadcn/ui, o `shadcn init` trocou as fontes e o tema e atualizou pacotes sem relação no lockfile. Foi tudo revertido, e a regra para não repetir está em [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md).

**Feito à mão, sem IA:**

- A criação do token do GitHub e dos segredos do Jenkins (`jenkins/.env`), que não passam pela IA.
- A escolha das referências visuais: as telas de exemplo em `UI Ideas/`, os efeitos da troca de tema e a imagem 404 do http.cat.
- Os testes do app rodando no Docker local e a decisão do que muda de rumo (os ajustes acima).

- [ ] **A completar:** conferir a lista acima e acrescentar o resto do que foi feito à mão (por exemplo, as fotos e os crimes dos gatos, quando entrarem)

#### Marco Di Toro | 150 | GES