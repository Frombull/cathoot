# Cathoot — memória do projeto

O **Cathoot** é o "Kahoot de tribunal de gato". A turma vota **Culpado** ou **Inocente** para cada gato cadastrado (nome, imagem meme e crime). Pensado para votação ao vivo com muita gente votando ao mesmo tempo.

## Documentação detalhada (`docs/`)

Leia o arquivo relevante antes de trabalhar no assunto. Ao tomar uma decisão nova, atualize o `.md` correspondente.

- [docs/visao.md](docs/visao.md): o que é o projeto, fluxo do jogo e princípios.
- [docs/roadmap.md](docs/roadmap.md): plano geral das próximas etapas.
- [docs/arquitetura.md](docs/arquitetura.md): diagramas da aplicação e do CI.
- [docs/api.md](docs/api.md): endpoints REST e códigos de erro.
- [docs/regras-de-negocio.md](docs/regras-de-negocio.md): estados da sessão, regras de voto e modelo de dados.
- [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md): stack, monorepo, pnpm, Docker e Vercel.
- [docs/visual.md](docs/visual.md): identidade visual, fontes e animações.
- [docs/branches.md](docs/branches.md): fluxo `dev` → `master` e proteções.
- [docs/ideias.md](docs/ideias.md): ideias em aberto e descartadas.

## Regras

- **Gerenciador de pacotes: somente pnpm.** Nunca usar `npm` nem `yarn`, nem gerar `package-lock.json` ou `yarn.lock`. Detalhes em [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md).
- **Branches:** commits direto na `dev`; a `master` só entra por PR. Detalhes em [docs/branches.md](docs/branches.md).
- Manter o app pequeno e simples, com builds reproduzíveis e testes rápidos.
- **Visual:** bobinho e divertido, nada de fonte monoespaçada nem visual corporativo. Detalhes em [docs/visual.md](docs/visual.md).
- Documentação e textos em português, como o README.
- **Nunca adicionar `Co-Authored-By` nem qualquer atribuição a IA** em commits ou PRs.
