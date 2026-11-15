# Visão do projeto

Projeto da disciplina **S107 - Gerência de Configuração e Evolução de Software**.
O app é descartável: o objetivo real é praticar e testar um pipeline de CI/CD no **Jenkins**.

## O que é o Cathoot

O **Cathoot** (nome definido em 2026-10-06) é o "Kahoot de tribunal de gato".

Cada gato do catálogo tem nome, imagem meme e o "crime" cometido (arquivos em `apps/api/catalog/`), e a turma vota **Culpado** ou **Inocente**.

Será usado numa votação em sala de aula na apresentação, então precisa ser divertido e funcionar bem com muita gente votando ao mesmo tempo.

## Fluxo do jogo

1. O apresentador (painel protegido por senha simples) cria uma sessão e mostra um QR code com o código da sala.
2. A turma entra pelo QR code ou digitando o código curto da sala na landing, digita só o nome e espera no lobby.
3. O apresentador clica em "Começar julgamento": aparece o gato com o crime, e os alunos votam.
4. O apresentador clica em "Revelar veredito": todos veem o placar e o veredito. "Próximo gato" segue para o seguinte.
5. No fim, o resumo: o gato mais culpado e a Prisão da Soneca.

Fluxo E2E principal: criar sala → entrar → votar → ver o veredito.

## Princípios

- Manter o app pequeno e simples (um CRUD basta).
- Priorizar o que ajuda o pipeline: builds reproduzíveis, testes rápidos, imagens Docker e estágios claros.
