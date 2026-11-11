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
| `Jenkinsfile` com notificação por e-mail | ⬜ |
| E-mail vindo de variável de ambiente (sem endereço fixo) | ⬜ |
| Cobertura de testes ≥ 90% | ✅ (Vitest + V8 com `thresholds` de 90%: API 98%, web 98%, integração 100%) |
| Pacote e relatório de testes como **artefatos** (`archiveArtifacts`) | ✅ (`pacotes/*.tgz` + JUnit, cobertura, Playwright e k6) |
| Imagem publicada no Docker Hub, com link no README | ⬜ |
| Compose com 4+ containers, comunicação entre 2+ e volumes | ✅ (`postgres`, `api`, `web`, `jenkins`) |
| Compose subindo a imagem do Docker Hub (hoje o Jenkins usa `build: .`) | ⬜ |
| README com instalação, execução, uso e funcionalidades | 🟡 |
| README com a seção "Uso de IA" | 🟡 (base escrita; faltam prompts e partes feitas à mão) |
| Commits de todos os membros | ⬜ (hoje só um autor) |

## Eliminatórios

Faltar à defesa; commits claramente irrelevantes; copiar configuração gerada por IA sem entender; criar etapas pela interface do Jenkins; discrepância clara de contribuição entre os integrantes.

## Uso de IA

O professor não pune o uso, pune a falta de honestidade e de entendimento. Por isso o README tem a seção "Uso de IA" e tudo que a IA gerar tem que ser explicável por quem vai defender. Manter a seção atualizada ao longo do projeto.
