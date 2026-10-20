# S107 — memória do projeto

Projeto da disciplina **S107 - Gerência de Configuração e Evolução de Software**.
O app é descartável: o objetivo real é praticar e testar um pipeline de CI/CD no **Jenkins**.

O app se chama **Cathoot**: o "Kahoot de tribunal de gato". A turma vota **Culpado** ou **Inocente** para cada gato cadastrado (nome, imagem meme e crime). Será usado numa votação em sala de aula na apresentação, então precisa ser divertido e funcionar bem com muita gente votando ao mesmo tempo.

## Documentação detalhada (`docs/`)

Leia o arquivo relevante antes de trabalhar no assunto. Ao tomar uma decisão nova, atualize o `.md` correspondente.

- [docs/visao.md](docs/visao.md): o que é o projeto, fluxo do jogo e princípios.
- [docs/roadmap.md](docs/roadmap.md): plano geral das próximas etapas.
- [docs/arquitetura.md](docs/arquitetura.md): diagramas da aplicação e do pipeline.
- [docs/regras-de-negocio.md](docs/regras-de-negocio.md): estados da sessão, regras de voto e modelo de dados (alvo dos testes).
- [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md): stack, monorepo, pnpm, Vercel e `ignoreCommand`.
- [docs/visual.md](docs/visual.md): identidade visual, fontes e animações.
- [docs/pipeline.md](docs/pipeline.md): estágios do Jenkins.
- [docs/branches.md](docs/branches.md): fluxo `dev` → `master` e proteções.
- [docs/ideias.md](docs/ideias.md): ideias em aberto e descartadas.

## Regras

- **Gerenciador de pacotes: somente pnpm.** Nunca usar `npm` nem `yarn`, nem gerar `package-lock.json` ou `yarn.lock`. Detalhes em [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md).
- **Branches:** commits direto na `dev`; a `master` só entra por PR. Detalhes em [docs/branches.md](docs/branches.md).
- Manter o app pequeno e simples (um CRUD basta). Priorizar o que ajuda o pipeline: builds reproduzíveis, testes rápidos, imagens Docker e estágios claros.
- **Visual:** bobinho e divertido, nada de fonte monoespaçada nem visual corporativo. Detalhes em [docs/visual.md](docs/visual.md).
- Documentação e textos em português, como o README.
- **Nunca adicionar `Co-Authored-By` nem qualquer atribuição ao Claude** em commits ou PRs. Mensagens de commit ficam sem esse trailer.
