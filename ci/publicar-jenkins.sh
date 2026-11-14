#!/usr/bin/env bash
# Gera a imagem do Jenkins (jenkins/Dockerfile) e publica no Docker Hub.
# A imagem é arm64: o notebook e o computador do professor são Mac com Apple Silicon.
#
# Precisa do login feito antes (docker login). Variáveis:
#   DOCKERHUB_USER  usuário do Docker Hub (obrigatória)
#   TAG             tag publicada além de "latest" (padrão: só latest)
#   PUBLICAR=0      só gera a imagem, sem enviar (para testar o build)
set -euo pipefail

: "${DOCKERHUB_USER:?Defina DOCKERHUB_USER (usuário do Docker Hub)}"
IMAGEM="$DOCKERHUB_USER/cathoot-jenkins"
CONTEXTO="$(cd "$(dirname "$0")/../jenkins" && pwd)"

nomes=("$IMAGEM:latest")
if [ -n "${TAG:-}" ] && [ "$TAG" != latest ]; then
  nomes+=("$IMAGEM:$TAG")
fi
tags=()
for nome in "${nomes[@]}"; do
  tags+=(--tag "$nome")
done

docker build --platform linux/arm64 "${tags[@]}" "$CONTEXTO"

if [ "${PUBLICAR:-1}" = 0 ]; then
  echo "Imagem gerada, sem publicar: ${nomes[*]}"
  exit 0
fi

for nome in "${nomes[@]}"; do
  docker push "$nome"
done
echo "Publicada: ${nomes[*]}"
echo "Página: https://hub.docker.com/r/$IMAGEM"
