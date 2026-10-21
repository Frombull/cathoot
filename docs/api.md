# API REST

NestJS em `apps/api`, porta 3001. Corpo e resposta em JSON. O front consulta o estado por polling (~1,5 s).

## Autorização

- **Criar sala:** senha do apresentador (`PRESENTER_PASSWORD`) no corpo.
- **Ações do apresentador** (`start`, `reveal`, `next`): header `x-presenter-token` com o token devolvido ao criar *aquela* sala.
- **Aluno:** sem login. Ao entrar recebe um `participantId`, que o front guarda e envia ao votar.

## Endpoints

| Método e rota | Corpo / query | Resposta |
| --- | --- | --- |
| `POST /sessions` | `{ "password" }` | `201` `{ code, presenterToken }`; a sala nasce no `LOBBY` com todos os gatos do catálogo |
| `GET /sessions/:code` | `?participantId=` (opcional) | `200` `SessionView` (sem cache) |
| `POST /sessions/:code/participants` | `{ "name" }` | `201` `{ participantId, name }` |
| `POST /sessions/:code/votes` | `{ "participantId", "choice": "CULPADO" \| "INOCENTE" }` | `204` |
| `POST /sessions/:code/start` | header do apresentador | `200` `SessionView` |
| `POST /sessions/:code/reveal` | header do apresentador | `200` `SessionView` |
| `POST /sessions/:code/next` | header do apresentador | `200` `SessionView` |
| `GET /cats` | | `200` lista do catálogo (`id`, `name`, `crime`, `imageUrl`) |
| `GET /cats/:arquivo` | | imagem de um gato do catálogo (`404` para qualquer outro nome) |
| `GET /health` | | `200` `{ "status": "ok" }` |

O código da sala não diferencia maiúsculas nem espaços nas pontas.

## SessionView

```json
{
  "code": "ABC234",
  "state": "VOTANDO",
  "participants": ["Ana", "Beto"],
  "totalCats": 3,
  "catNumber": 1,
  "cat": { "name": "Bolinha", "imageUrl": "/cats/1.jpg", "crime": "..." },
  "votesReceived": 1,
  "hasVoted": true,
  "result": null,
  "summary": null
}
```

- `cat` e `catNumber` existem em `VOTANDO` e `RESULTADO`; `null` no `LOBBY` e no `FIM`.
- `votesReceived` conta quantos já votaram no gato atual, sem dizer o lado. O placar (`result`: `guilty`, `innocent`, `verdict`) só aparece em `RESULTADO`.
- `hasVoted` só vem se a consulta tiver `participantId`.
- `summary` (`prison` e `mostGuilty`) só existe no `FIM`.

## Erros

Formato `{ "code": "...", "message": "..." }`. O `code` é o do domínio e fica estável.

| Status | Códigos |
| --- | --- |
| `400` | `REQUEST_INVALID` (campo ausente ou do tipo errado), `PARTICIPANT_NAME_REQUIRED`, `VOTE_CHOICE_INVALID` |
| `401` | `PRESENTER_UNAUTHORIZED` (senha ou token errado) |
| `404` | `SESSION_NOT_FOUND`, `PARTICIPANT_NOT_FOUND` |
| `409` | `PARTICIPANT_NAME_TAKEN`, `ALREADY_VOTED`, `VOTING_CLOSED`, `INVALID_STATE_TRANSITION`, `SESSION_NOT_IN_LOBBY`, `SESSION_FINISHED`, `SESSION_HAS_NO_CATS`, `SESSION_NOT_FINISHED` |
| `503` | `ROOM_CODE_EXHAUSTED` |

Qualquer outro `DomainError` vira `400`.

## Imagens e o front

`imageUrl` é um caminho da própria API (`/cats/1.jpg`). Para o `web` (outra origem) usar sem CORS, o plano é um *rewrite* do Next de `/api/*` e `/cats/*` para a API; isso entra com as telas.
