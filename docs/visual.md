# Visual

- Bobinho e divertido, estilo "macarrão": fontes arredondadas, gordinhas e curvas, bem de brincadeira.
- **Nada de fonte monoespaçada** nem visual sério/corporativo.
- Fontes (2026-10-19): **Fredoka** nos títulos e **Nunito** no texto, instaladas pelo pnpm (`@fontsource-variable/*`) em vez de `next/font/google`, para o build não depender de rede externa.
- Cores vibrantes e animações leves.
- O gatinho correndo pela tela pode ser só efeito visual, com emoji ou uma sprite sheet única.

## Temas claro e escuro

- Os dois temas são obrigatórios em toda tela nova.
- O tema é o atributo `data-theme` no `<html>`, aplicado por um script inline antes da primeira pintura (sem flash). Começa pelo tema do sistema e a escolha do botão fica no `localStorage`.
- A troca usa a View Transitions API e cada clique usa o próximo efeito: **retângulo → círculo com blur → persianas**. CSS puro em `globals.css` (atributo `data-vt` no `<html>`), baseado em beui.dev/components/motion/theme-toggle. Sem suporte à API ou com "reduzir movimento", a troca é instantânea.
- As cores são variáveis CSS em `apps/web/src/app/globals.css` (nomes compatíveis com o shadcn/ui). Não usar cor fixa nos componentes; usar `bg-background`, `text-foreground`, `bg-primary` etc.
- Escuro: fundo azul-roxo profundo, texto creme. Claro: fundo creme, texto roxo-tinta. Roxo `primary` e amarelo `accent` nos dois.

## Telas

- Landing (`/`): feita a partir do mock "Tribunal Felino em Ação". Corta ranking, perfil e login, que não fazem parte do jogo. No lugar do "Entrar" ficam "Criar sala" (apresentador) e o campo do código da sala (aluno). A ilustração do gato juiz (`public/hero-juiz.jpg`) é um recorte do mock, serve de placeholder.
- Todas as telas usam a mesma moldura (`PageShell`: brilho no fundo, logo e botão de tema).
- `/criar` e `/entrar`: título grande e um cartão com o formulário. Mensagens de erro com tom de brincadeira ("Senha errada! Só o juiz pode abrir o tribunal.").
- Telão (`/sala/<código>/apresentador`): no lobby, QR code em fundo branco (para ler bem no tema escuro), o código gigante e os nomes da turma aparecendo como "balões". Na votação, o gato lado a lado com a ficha do crime e a barra de quantos já votaram.
- Celular do aluno (`/sala/<código>`): o gato empilhado, com a foto limitada a ~38% da altura para os botões **Culpado** (vermelho, martelo) e **Inocente** (verde, aperto de mão) caberem sem rolar.
- Veredito: carimbo "CULPADO!"/"INOCENTE!" que cai na tela (`animate-stamp`) e, se culpado, grades por cima da foto. Placar em barras.
- Resumo: "Gato mais culpado" com coroa e a "Prisão da Soneca" com as fotos atrás das grades.
- Cores do veredito: `--guilty` (vermelho) e `--innocent` (verde), iguais nos dois temas, com texto branco.
- 404 (`not-found.tsx`): foto do [HTTP Cats](https://http.cat/404) (`public/gato-404.jpg`), sobre fundo preto fixo, sem header, com o título "Esse gato se escondeu." e botão de volta para a landing.

## Referências

Imagens de ideias de UI e logos em [`UI Ideas/`](../UI%20Ideas/) (na raiz do repositório).
