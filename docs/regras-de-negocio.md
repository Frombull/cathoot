# Regras de negócio

Alvo dos testes (unitários, integração e E2E).

## Estados da sessão

```text
LOBBY → VOTANDO → RESULTADO → VOTANDO → ... → FIM
```

- Só se vota em `VOTANDO`.
- Só o apresentador avança o estado. O domínio (`Session`) só expõe as ações; a API é quem confere a senha do apresentador.

Transições (qualquer outra falha com `INVALID_STATE_TRANSITION`):

| Ação | De | Para |
| --- | --- | --- |
| `start` ("Próximo" no lobby) | `LOBBY` (com ao menos 1 gato) | `VOTANDO` (primeiro gato) |
| `reveal` ("Revelar") | `VOTANDO` | `RESULTADO` |
| `next` ("Próximo") | `RESULTADO` | `VOTANDO` (gato seguinte) ou `FIM` (acabaram os gatos) |

## Regras

- O voto é único e imutável: um voto por participante por gato, sem trocar de lado.
- O nome do participante é único na sessão, sem diferenciar maiúsculas nem espaços nas pontas.
- Participantes podem entrar a qualquer momento, até o `FIM`.
- Gatos só são cadastrados no `LOBBY`.
- **Veredito:** calculado no "Revelar". `CULPADO` só com mais votos de culpado que de inocente. Empate ou zero votos dá `INOCENTE` ("na dúvida, solta o gato"). Não há quórum mínimo.
- Gato condenado vai para a "Prisão da Soneca". O resumo final (só no `FIM`) lista os condenados na ordem do julgamento e o gato mais culpado (mais votos de culpado; empate vale o primeiro julgado; nenhum se ninguém votou culpado).
- Nome do gato e crime são obrigatórios; a imagem precisa ser uma URL `http` ou `https`.

Implementado em `apps/api/src/session/` (TypeScript puro, sem banco), com testes em `*.spec.ts`. Erros do domínio são `DomainError` com um `code` estável (`ALREADY_VOTED`, `VOTING_CLOSED`, `PARTICIPANT_NAME_TAKEN`...) que a API vai traduzir para HTTP.

## Código da sala

- Código curto, de 6 caracteres (valor provisório, definido pelo tamanho do campo na landing). Maiúsculas e sem caracteres que se confundem (0/O, 1/I).
- Único entre as sessões ativas: o gerador sorteia de novo se o código já existe e desiste após 10 tentativas (`ROOM_CODE_EXHAUSTED`). A API normaliza para maiúsculas, já que o campo da landing só mostra em maiúsculas.
- O QR code leva a `/entrar?codigo=XXXXXX`, o mesmo endereço do formulário da landing.

## Identidade

Nome + cookie anônimo, sem login.

## Modelo de dados

`Session`, `Cat`, `Participant`, `Vote` (único por participante + gato).
