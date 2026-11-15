# Branches

Definido em 2026-10-06. A branch principal é **`master`** (não `main`) e existe a branch de integração **`dev`**.

## Fluxo

Commits **direto na `dev`** → PR `dev` → `master`. A `master` é o que vai para produção na Vercel.

### Depois de mergear um PR

O PR entra na `master` com um merge commit que a `dev` não tem. Como a `master` exige a branch atualizada antes do merge, o próximo PR pediria o botão "Update branch", que cria um `Merge branch 'master' into dev` vazio.

Para evitar, **logo depois do merge e antes de qualquer commit novo na `dev`**:

```bash
git checkout dev
git pull --ff-only origin master   # a dev só avança até o merge do PR, sem commit extra
git push origin dev
```

Se já tiver commit novo na `dev`, o `--ff-only` falha: aí o jeito é um merge da `master` na `dev` (um commit de merge sem mudança de arquivo).

Não fazer commit direto na `master` local: ela só deve seguir a `origin/master` (`git branch -f master origin/master` alinha).

## Proteções no GitHub

- **`master`**: protegida (vale também para o admin).
  - Só entra por PR, com os checks **`Vercel`** e **`continuous-integration/jenkins/branch`** passando e a branch atualizada antes do merge.
  - O check `Vercel` fica `success` mesmo quando o `ignoreCommand` cancela o build.
  - O check do Jenkins só chega com o Jenkins local ligado; desligado, nenhum PR fica mergeável.
  - Sem push direto, force push nem deleção.
- **`dev`**: push direto liberado, sem check obrigatório. Só bloqueia force push e deleção.
- Mensagens de commit no estilo Conventional Commits (`feat:`, `fix:`, `docs:`...).
- Sem exigência de aprovação de review (repo individual). Subir para 1 aprovação se mais gente entrar.
