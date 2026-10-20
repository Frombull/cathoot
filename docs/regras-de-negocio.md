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

## Código da sala

- Código curto, de até 6 caracteres (valor provisório, definido pelo tamanho do campo na landing). Maiúsculas e sem caracteres que se confundem (0/O, 1/I).
- Único entre as sessões ativas. A API normaliza para maiúsculas, já que o campo da landing só mostra em maiúsculas.
- O QR code leva a `/entrar?codigo=XXXXXX`, o mesmo endereço do formulário da landing.

## Identidade

Nome + cookie anônimo, sem login.

## Modelo de dados

`Session`, `Cat`, `Participant`, `Vote` (único por participante + gato).
