#!/usr/bin/env bash
# Empacota o resultado do "pnpm build" em pacotes/*.tgz, que o Jenkinsfile arquiva como artefatos.
# Chamado no estágio Build, da raiz do repositório.
#
#   cathoot-api-<versão>.tgz  dist/ compilado + prisma/ (migrations) + catalog/ (gatos) + package.json.
#                             Para rodar: pnpm install --prod, prisma migrate deploy e node dist/main.js
#   cathoot-web-<versão>.tgz  saída "standalone" do Next, já com o node_modules que ele precisa.
#                             Para rodar: node apps/web/server.js. O endereço da API fica fixo no build
#                             (API_URL; sem ele, http://localhost:3001), ver apps/web/next.config.ts
set -euo pipefail

versao="${BUILD_NUMBER:-local}"
rm -rf pacotes
mkdir -p pacotes/web

tar -czf "pacotes/cathoot-api-${versao}.tgz" -C apps/api dist prisma catalog package.json prisma.config.ts

# Mesma montagem do apps/web/Dockerfile: o standalone não inclui os arquivos estáticos nem o public/
cp -R apps/web/.next/standalone/. pacotes/web/
mkdir -p pacotes/web/apps/web/.next
cp -R apps/web/.next/static pacotes/web/apps/web/.next/static
cp -R apps/web/public pacotes/web/apps/web/public
tar -czf "pacotes/cathoot-web-${versao}.tgz" -C pacotes/web .
rm -rf pacotes/web

ls -lh pacotes
