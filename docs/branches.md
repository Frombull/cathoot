# Branches

Definido em 2026-10-06. A branch principal é **`master`** (não `main`) e existe a branch de integração **`dev`**.

## Fluxo

Commits **direto na `dev`** → PR `dev` → `master`. A `master` é o que vai para produção na Vercel.

## Proteções no GitHub

- **`master`**: protegida (vale também para o admin).
  - Só entra por PR, com os checks **`Vercel`** e **`continuous-integration/jenkins/branch`** passando e a branch atualizada antes do merge.
  - O check `Vercel` fica `success` mesmo quando o `ignoreCommand` cancela o build.
  - O check do Jenkins só chega com o Jenkins local ligado; desligado, nenhum PR fica mergeável.
  - Sem push direto, force push nem deleção.
- **`dev`**: push direto liberado, sem check obrigatório. Só bloqueia force push e deleção.
- Mensagens de commit no estilo Conventional Commits (`feat:`, `fix:`, `docs:`...).
- Sem exigência de aprovação de review (repo individual). Subir para 1 aprovação se mais gente entrar.
