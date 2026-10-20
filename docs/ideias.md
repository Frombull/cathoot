# Ideias

Registro de ideias em aberto e descartadas, para não rediscutir o que já foi decidido.

## Sugestões já discutidas (ainda não adotadas)

- Prettier
- Jest/Vitest
- Supertest
- SonarQube
- Trivy
- Conventional Commits
- Webhook do GitHub (hoje é periodic scan; precisaria de ngrok ou smee.io para alcançar o Jenkins local)
- Relatórios JUnit/HTML do Playwright no Jenkins

## Adotadas

- ESLint no estágio "Lint + types" (2026-10-19).
- Dockerfiles multi-stage (`apps/web/Dockerfile`, 2026-10-19).
- Multibranch Pipeline no Jenkins, configurado por JCasC + Job DSL (2026-10-19).

## Descartadas

- Conceito original "Tribunal dos Gatos" (virou o Cathoot em 2026-10-06).
- WebSocket para tempo real (troca por polling).
- Upload de imagens (troca por URL).
