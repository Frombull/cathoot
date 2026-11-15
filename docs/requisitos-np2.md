# Requisitos da NP2 (professor)

Resumo do enunciado em [`Projeto_S07_NP2.pdf`](../Projeto_S07_NP2.pdf). Datas de entrega e defesa serão enviadas depois pelo professor. Estado atual de cada item abaixo; o que falta também está no [roadmap](roadmap.md#7-requisitos-da-np2).

## Regras gerais

- Sistema original (não pode ser o das aulas) e repositório **público** no GitHub do time da matéria.
- Grupos de 4 a 6 pessoas, com **commits relevantes de todos**. Entrega no Teams: link do GitHub e link da imagem no Docker Hub.
- Jenkins **em container**, sem GitHub Actions. A interface do Jenkins só pode fazer o checkout; as etapas ficam no `Jenkinsfile`.
- Cobertura de testes **≥ 90%**.
- Defesa em **perguntas e respostas** (até 20 min): todos respondem qualquer coisa, com respostas concretas (arquivo, commit, log ou artefato). O professor pode pedir para rodar o pipeline ao vivo.

## Checklist

| Requisito | Estado |
| --- | --- |
| Aplicação funcional | ✅ |
| Jenkins em container (`jenkins/Dockerfile`), configurado por código | ✅ |
| `Jenkinsfile` com testes e build | ✅ |
| `Jenkinsfile` com notificação por e-mail | ✅ (`post { always }` chama `ci/notificar-email.sh`) |
| E-mail vindo de variável de ambiente (sem endereço fixo) | ✅ (`NOTIFY_EMAIL` no `jenkins/.env`; chega no Mailpit em <http://localhost:8025>) |
| Cobertura de testes ≥ 90% | ✅ (Vitest + V8 com `thresholds` de 90%: API 98%, web 98%, integração 100%) |
| Pacote e relatório de testes como **artefatos** (`archiveArtifacts`) | ✅ (`pacotes/*.tgz` + JUnit, cobertura, Playwright e k6) |
| Imagem publicada no Docker Hub, com link no README | 🟡 conta `marcoditoroinatel` criada e credencial `dockerhub` no Jenkins (login testado); link no README: <https://hub.docker.com/r/marcoditoroinatel/cathoot-jenkins>. Falta a primeira publicação, que sai no próximo build verde da `master` |
| Compose com 4+ containers, comunicação entre 2+ e volumes | ✅ (`postgres`, `api`, `web`, `jenkins`, `mailpit`; volumes `pgdata`, `jenkins_home`, `mailpit_data`) |
| Compose com containers do Docker Hub e de Dockerfile local | ✅ do Hub: `jenkins` (a imagem publicada pelo pipeline), `postgres`, `mailpit`; local: `api`, `web` |
| README com instalação, execução, uso e funcionalidades | ✅ (com o link do Docker Hub) |
| README com a seção "Uso de IA" | ✅ modelos, dinâmica, 6 prompts reais e uma resposta descartada. 🟡 conferir a lista do que foi feito à mão |
| Commits de todos os membros | 🟡 grupo de 2, só o Marco commita (ver abaixo) |

O grupo tem duas pessoas: o Marco e um colega que ainda não contribuiu. Se continuar assim, o Marco faz e apresenta tudo sozinho. O enunciado pede de 4 a 6 integrantes com commits de todos, e a discrepância de contribuição é eliminatória. Vale alinhar com o professor antes da defesa.

## Eliminatórios

Faltar à defesa; commits claramente irrelevantes; copiar configuração gerada por IA sem entender; criar etapas pela interface do Jenkins; discrepância clara de contribuição entre os integrantes.

## Uso de IA

O professor não pune o uso, pune a falta de honestidade e de entendimento. Por isso o README tem a seção "Uso de IA" e tudo que a IA gerar tem que ser explicável por quem vai defender. Manter a seção atualizada ao longo do projeto.
