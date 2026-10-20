# Regras de negócio

Alvo dos testes (unitários, integração e E2E).

## Estados da sessão

```
LOBBY → VOTANDO → RESULTADO → VOTANDO → ... → FIM
```

- Só se vota em `VOTANDO`.
- Só o apresentador avança o estado.

## Regras

- O voto é único e imutável: um voto por participante por gato.
- O nome do participante é único na sessão.
- O veredito muda ao atingir o limite de votos.
- Gato condenado vai para a "Prisão da Soneca".
- Nome do gato e crime são obrigatórios; a imagem precisa ter uma URL válida.

## Identidade

Nome + cookie anônimo, sem login.

## Modelo de dados

`Session`, `Cat`, `Participant`, `Vote` (único por participante + gato).
