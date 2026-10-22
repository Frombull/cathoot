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
- Nome do gato e crime são obrigatórios; a imagem precisa ser uma URL `http`/`https` ou uma imagem do catálogo (`/cats/<id>.jpg|jpeg|png`).

Implementado em `apps/api/src/session/` (TypeScript puro, sem banco), com testes em `*.spec.ts`. Erros do domínio são `DomainError` com um `code` estável (`ALREADY_VOTED`, `VOTING_CLOSED`, `PARTICIPANT_NAME_TAKEN`...) que a API vai traduzir para HTTP.

## Catálogo de gatos

Os gatos do jogo ficam em `apps/api/catalog/`: um `gatos.yaml` com `nome` e `crime` de cada id, e uma imagem por id (`1.jpg`, `2.png`). Formato completo no [README da pasta](../apps/api/catalog/README.md).

- `loadCatalog()` lê o `gatos.yaml` e as imagens, ordena pelo número do id e valida cada gato com as mesmas regras de `createCat`.
- Falha, apontando o gato, se o YAML estiver quebrado ou tiver id repetido ou inválido (`CATALOG_FILE_INVALID`), se faltar o arquivo (`CATALOG_FILE_MISSING`) ou a imagem (`CATALOG_IMAGE_MISSING`), se houver imagem sem bloco no YAML (`CATALOG_ENTRY_MISSING`), mais de uma imagem por gato (`CATALOG_IMAGE_DUPLICATED`) ou nome/crime vazios. Um teste roda isso no catálogo real, então o pipeline barra um gato quebrado.
- Só `jpg`, `jpeg` e `png`. Os gatos 1 a 3 são exemplos, com fotos provisórias do Cataas.

## Código da sala

- Código curto, de 6 caracteres (valor provisório, definido pelo tamanho do campo na landing). Maiúsculas e sem caracteres que se confundem (0/O, 1/I).
- Único entre as sessões ativas: o gerador sorteia de novo se o código já existe e desiste após 10 tentativas (`ROOM_CODE_EXHAUSTED`). A API normaliza para maiúsculas, já que o campo da landing só mostra em maiúsculas.
- O QR code leva a `/entrar?codigo=XXXXXX`, o mesmo endereço do formulário da landing.

## Identidade

Nome, sem login. O front guarda no `localStorage`, por sala, o `participantId` do aluno e o `presenterToken` do apresentador (`apps/web/src/lib/storage.ts`). Recarregar a página ou escanear o QR de novo volta para a mesma pessoa; os botões do apresentador só aparecem no navegador que criou a sala (em outro, a tela é só "telão").

## Modelo de dados

Uma tabela `Session` (Postgres, via Prisma): `code` (chave), `presenterToken`, `snapshot` (JSON), `createdAt`, `updatedAt`.

- O `snapshot` é a `Session` do domínio inteira (`toSnapshot()` / `Session.restore()`): estado, gatos, participantes, votos do gato atual e resultados anteriores. Assim as regras (voto único por participante + gato, estados) continuam só no domínio, sem duplicar em SQL, e os testes unitários valem para o que roda em produção.
- A API mantém cada sala em memória (uma única instância) e grava o snapshot a cada ação, em fila por sala. Se reiniciar, a sala é lida do banco no primeiro acesso.
- Não há tabelas separadas de gato, participante e voto. Se um dia for preciso consultar votos por SQL, é só normalizar a partir do snapshot.
- `presenterToken` é gerado ao criar a sala (16 bytes aleatórios) e autoriza as ações do apresentador naquela sala. A senha do apresentador só serve para criar salas.
