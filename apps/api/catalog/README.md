# Catálogo de gatos

Os gatos do jogo ficam aqui. Cada gato tem um **número** (o id) e duas partes:

- **Imagem:** `<id>.jpg`, `<id>.jpeg` ou `<id>.png` (`1.jpg`, `2.png`...). Só uma por gato.
- **Dados:** um bloco no [`gatos.yaml`](gatos.yaml), com o mesmo número.

```yaml
1:
  nome: Bolinha
  crime: Bebeu água do esgoto
```

Para adicionar um gato: coloque a imagem aqui e acrescente o bloco no `gatos.yaml`.

As fotos dos gatos 1 a 3 são provisórias (baixadas do [Cataas](https://cataas.com)): troque pelos memes de verdade, mantendo o número.

Outros arquivos (como este README) são ignorados. Um teste (`catalog.spec.ts`) falha se algum gato estiver sem imagem, sem nome ou sem crime, ou se houver imagem sem bloco no YAML, então o pipeline avisa antes de a turma ver um gato quebrado.
