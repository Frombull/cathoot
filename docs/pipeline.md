# Pipeline (Jenkins)

## Estágios previstos

lint e type-check → testes unitários → build → testes de integração (Postgres no Compose) → E2E (Playwright) → deploy.

## Notas

- Multibranch Pipeline cobre `dev`, `master` e PRs.
- Webhook do GitHub dispara o build.
- Quando o Jenkins existir, adicionar o contexto dele (ex.: `continuous-integration/jenkins/branch`) aos checks obrigatórios da `master`.
- Relatórios JUnit/HTML do Playwright publicados no Jenkins.
- Instalação com `pnpm install --frozen-lockfile` (ver [decisoes-tecnicas.md](decisoes-tecnicas.md)).
