# Visão do projeto

Projeto da disciplina **S107 - Gerência de Configuração e Evolução de Software**.
O app é descartável: o objetivo real é praticar e testar um pipeline de CI/CD no **Jenkins**.

## O que é o Cathoot

O **Cathoot** (nome definido em 2026-10-06) é o "Kahoot de tribunal de gato". Ideia escolhida em 2026-10-05; o conceito original era "Tribunal dos Gatos".

Cadastra-se um gato (nome, imagem meme e o "crime" cometido) e a turma vota **Culpado** ou **Inocente**.

Será usado numa votação em sala de aula na apresentação, então precisa ser divertido e funcionar bem com muita gente votando ao mesmo tempo.

## Fluxo do jogo

Formato "Kahoot de Tribunal de Gato", decidido em 2026-10-05. Simples e divertido.

1. O apresentador (painel protegido por senha simples) cria uma sessão e mostra um QR code com o código da sala.
2. A turma entra pelo QR, digita só o nome e espera no lobby.
3. O apresentador clica em "Próximo": aparece o gato com o crime, e os alunos votam.
4. O apresentador clica em "Revelar": todos veem o placar e o veredito. Depois vem o próximo gato.
5. No fim, um resumo (gato mais culpado etc.).

Fluxo E2E principal: cadastrar gato → votar → ver o veredito.

## Princípios

- Manter o app pequeno e simples (um CRUD basta).
- Priorizar o que ajuda o pipeline: builds reproduzíveis, testes rápidos, imagens Docker e estágios claros.

## Outros documentos

- [regras-de-negocio.md](regras-de-negocio.md)
- [decisoes-tecnicas.md](decisoes-tecnicas.md)
- [visual.md](visual.md)
- [pipeline.md](pipeline.md)
- [branches.md](branches.md)
- [ideias.md](ideias.md)
