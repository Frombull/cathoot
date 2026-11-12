#!/usr/bin/env bash
# Manda um e-mail com o resultado do build. Chamado pelo Jenkinsfile no post { always },
# para avisar também quando o build falha.
#
# Nada fica fixo no código: tudo vem de variáveis de ambiente.
#   NOTIFY_EMAIL               destinatário (vários separados por vírgula). Sem ele, só avisa e sai
#   SMTP_URL                   servidor SMTP (padrão: smtp://mailpit:1025, o Mailpit do compose)
#   SMTP_USER, SMTP_PASSWORD   login no SMTP, se ele pedir (ex.: Gmail com senha de app)
#   MAIL_FROM                  remetente (padrão: jenkins@cathoot.local)
#   BUILD_STATUS, BUILD_DURATION                         passados pelo Jenkinsfile
#   JOB_NAME, BUILD_NUMBER, BUILD_URL, BRANCH_NAME, GIT_COMMIT   definidos pelo próprio Jenkins
#
# Roda dentro do workspace (raiz do repositório) para ler os relatórios dos testes.
set -euo pipefail

if [[ -z "${NOTIFY_EMAIL:-}" ]]; then
  echo "NOTIFY_EMAIL não definido: e-mail não enviado"
  exit 0
fi

smtp_url="${SMTP_URL:-smtp://mailpit:1025}"
from="${MAIL_FROM:-jenkins@cathoot.local}"
status="${BUILD_STATUS:-DESCONHECIDO}"
commit="${GIT_COMMIT:-$(git rev-parse HEAD 2>/dev/null || echo '?')}"

case "$status" in
  SUCCESS) resultado="passou" ;;
  UNSTABLE) resultado="instável" ;;
  FAILURE) resultado="falhou" ;;
  ABORTED) resultado="foi abortado" ;;
  *) resultado="terminou ($status)" ;;
esac

# "N testes, F falha(s)" somando os <testsuite> de um JUnit (Vitest, Playwright e k6 usam esse formato)
testes() {
  [[ -f "$1" ]] || { echo "não rodou"; return; }
  grep -o '<testsuite [^>]*>' "$1" | awk '
    {
      for (i = 1; i <= NF; i++)
        if ($i ~ /^(tests|failures|errors)="[0-9]+"/) {
          split($i, kv, "\"")
          n[substr($i, 1, index($i, "=") - 1)] += kv[2]
        }
    }
    END { printf "%d testes, %d falha(s)\n", n["tests"], n["failures"] + n["errors"] }'
}

# Porcentagens do coverage-summary.json do Vitest (o node já está na imagem do Jenkins)
cobertura() {
  [[ -f "$1" ]] || { echo "não rodou"; return; }
  node -p 'const t = require(process.argv[1]).total;
    `linhas ${t.lines.pct}% · ramos ${t.branches.pct}% · funções ${t.functions.pct}%`' "$PWD/$1"
}

assunto="[Cathoot] Build #${BUILD_NUMBER:-?} (${BRANCH_NAME:-?}) ${resultado}"
mensagem="$(mktemp)"
trap 'rm -f "$mensagem"' EXIT

cat > "$mensagem" <<EOF
From: Jenkins do Cathoot <${from}>
To: ${NOTIFY_EMAIL}
Subject: =?UTF-8?B?$(printf '%s' "$assunto" | base64 | tr -d '\n')?=
Date: $(LC_ALL=C date '+%a, %d %b %Y %H:%M:%S %z')
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

O build #${BUILD_NUMBER:-?} de ${JOB_NAME:-cathoot} ${resultado}.

Branch:   ${BRANCH_NAME:-?}
Commit:   ${commit:0:7} $(git log -1 --format='(%an) %s' "$commit" 2>/dev/null || true)
Duração:  ${BUILD_DURATION:-?}

Testes
  Unitários (API):   $(testes apps/api/test-results/junit.xml)
  Unitários (web):   $(testes apps/web/test-results/junit.xml)
  Integração (API):  $(testes apps/api/test-results/junit-integration.xml)
  E2E (Playwright):  $(testes e2e/test-results/junit.xml)
  Carga (k6):        $(testes load/test-results/junit.xml)

Cobertura (mínimo de 90%)
  Unitários (API):   $(cobertura apps/api/coverage/coverage-summary.json)
  Unitários (web):   $(cobertura apps/web/coverage/coverage-summary.json)
  Integração (API):  $(cobertura apps/api/coverage-integration/coverage-summary.json)
EOF

# O BUILD_URL depende da URL do Jenkins (unclassified.location no jenkins/casc.yaml)
if [[ -n "${BUILD_URL:-}" ]]; then
  cat >> "$mensagem" <<EOF

Links
  Build:      ${BUILD_URL}
  Console:    ${BUILD_URL}console
  Testes:     ${BUILD_URL}testReport/
  Artefatos:  ${BUILD_URL}artifact/
EOF
fi

args=(--silent --show-error --url "$smtp_url" --mail-from "$from" --upload-file "$mensagem")
IFS=',' read -ra destinatarios <<< "$NOTIFY_EMAIL"
for destinatario in "${destinatarios[@]}"; do
  args+=(--mail-rcpt "$(echo "$destinatario" | xargs)")
done
if [[ -n "${SMTP_USER:-}" ]]; then
  args+=(--user "${SMTP_USER}:${SMTP_PASSWORD:-}")
  # Com login em smtp:// exige STARTTLS, para a senha não passar em texto puro (smtps:// já é TLS)
  [[ "$smtp_url" == smtp://* ]] && args+=(--ssl-reqd)
fi

curl "${args[@]}"
echo "E-mail enviado para ${NOTIFY_EMAIL} (${assunto})"
