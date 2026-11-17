# Visão do projeto

## O que é o Cathoot

O **Cathoot** (nome definido em 2026-10-06) é o "Kahoot de tribunal de gato".

Cada gato do catálogo tem nome, imagem meme e o "crime" cometido (arquivos em `apps/api/catalog/`), e a turma vota **Culpado** ou **Inocente**.

Feito para votações ao vivo em sala ou eventos, então precisa ser divertido e aguentar muita gente votando ao mesmo tempo.

## Fluxo do jogo

1. O apresentador (painel protegido por senha simples) cria uma sessão e mostra um QR code com o código da sala.
2. A turma entra pelo QR code ou digitando o código curto da sala na landing, digita só o nome e espera no lobby.
3. O apresentador clica em "Começar julgamento": aparece o gato com o crime, e os alunos votam.
4. O apresentador clica em "Revelar veredito": todos veem o placar e o veredito. "Próximo gato" segue para o seguinte.
5. No fim, o resumo: o gato mais culpado e a Prisão da Soneca.

Fluxo E2E principal: criar sala → entrar → votar → ver o veredito.

## Princípios

- Manter o app simples e rápido, com foco na experiência ao vivo.
- Garantir builds reproduzíveis e testes confiáveis (unitários, integração, E2E e carga).
