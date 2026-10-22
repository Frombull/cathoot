import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { Rate } from "k6/metrics";

// A turma inteira numa sala só: cada aluno entra, acompanha a sala por polling (como o celular, a cada 1,5 s),
// baixa a foto de cada gato e vota; o apresentador conduz o jogo até o FIM. Passa pelo web (rewrite do Next),
// o mesmo caminho dos navegadores. Não depende do catálogo: lê o gato da vez na própria sala.
// Só módulos embutidos: o k6 2 tenta baixar um binário novo quando vê um import que não conhece.

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const PASSWORD = __ENV.PRESENTER_PASSWORD || "miau";
const STUDENTS = Number(__ENV.STUDENTS || 60);
const POLL_SECONDS = 1.5;
// Os alunos chegam aos poucos nesse intervalo, e cada um pensa até THINK_SECONDS antes de votar
const ARRIVAL_SECONDS = 10;
const THINK_SECONDS = 3;
const VERDICT_SECONDS = 3;
// Quanto o apresentador espera a turma entrar ou votar antes de desistir
const WAIT_LIMIT_SECONDS = 60;

const votesCounted = new Rate("votos_contados");
const gameFinished = new Rate("jogo_completo");

export const options = {
  scenarios: {
    alunos: { executor: "per-vu-iterations", exec: "student", vus: STUDENTS, iterations: 1, maxDuration: "10m" },
    apresentador: { executor: "per-vu-iterations", exec: "presenter", vus: 1, iterations: 1, maxDuration: "10m" },
  },
  summaryTrendStats: ["med", "p(95)", "max", "count"],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{acao:consultar}": ["p(95)<500"],
    "http_req_duration{acao:entrar}": ["p(95)<1000"],
    "http_req_duration{acao:votar}": ["p(95)<1000"],
    "http_req_duration{acao:imagem}": ["p(95)<2000"],
    checks: ["rate==1"],
    votos_contados: ["rate==1"],
    jogo_completo: ["rate==1"],
  },
};

function api(method, path, body, { acao, token } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers["x-presenter-token"] = token;
  // A tag name agrupa as URLs (cada uma tem o código da sala) por ação
  const params = { headers, tags: { acao, name: acao } };
  return http.request(method, `${BASE_URL}/api${path}`, body === undefined ? null : JSON.stringify(body), params);
}

function view(code, participantId) {
  const query = participantId ? `?participantId=${participantId}` : "";
  const res = api("GET", `/sessions/${code}${query}`, undefined, { acao: "consultar" });
  return res.status === 200 ? res.json() : null;
}

export function setup() {
  const res = api("POST", "/sessions", { password: PASSWORD }, { acao: "criar" });
  if (res.status !== 201) exec.test.abort(`Não criou a sala: ${res.status} ${res.body}`);
  return res.json();
}

export function student({ code }) {
  sleep(Math.random() * ARRIVAL_SECONDS);
  const name = `Aluno ${exec.vu.idInTest}`;
  const joined = api("POST", `/sessions/${code}/participants`, { name }, { acao: "entrar" });
  if (!check(joined, { "aluno entrou": (r) => r.status === 201 })) return;
  const { participantId } = joined.json();

  let seenCat = null;
  for (;;) {
    const current = view(code, participantId);
    if (current?.state === "FIM") return;
    if (current?.state === "VOTANDO") {
      // O celular baixa a foto uma vez por gato
      if (current.catNumber !== seenCat) {
        seenCat = current.catNumber;
        const image = http.get(BASE_URL + current.cat.imageUrl, { tags: { acao: "imagem", name: "imagem" } });
        check(image, { "foto do gato carregou": (r) => r.status === 200 });
      }
      if (!current.hasVoted) {
        sleep(Math.random() * THINK_SECONDS);
        const choice = Math.random() < 0.5 ? "CULPADO" : "INOCENTE";
        const voted = api("POST", `/sessions/${code}/votes`, { participantId, choice }, { acao: "votar" });
        check(voted, { "voto aceito": (r) => r.status === 204 });
      }
    }
    sleep(POLL_SECONDS);
  }
}

// O apresentador para o teste inteiro se o jogo travar, senão os alunos ficariam no polling até o maxDuration
function giveUp(reason) {
  gameFinished.add(false);
  exec.test.abort(reason);
}

// Como o telão: consulta a sala a cada 1,5 s até a condição valer
function waitFor(code, done) {
  const deadline = Date.now() + WAIT_LIMIT_SECONDS * 1000;
  while (Date.now() < deadline) {
    const current = view(code);
    if (current && done(current)) return current;
    sleep(POLL_SECONDS);
  }
  return null;
}

function act(code, token, action) {
  const res = api("POST", `/sessions/${code}/${action}`, undefined, { acao: action, token });
  if (!check(res, { [`${action} aceito`]: (r) => r.status === 200 })) giveUp(`${action} falhou: ${res.status} ${res.body}`);
  return res.json();
}

export function presenter({ code, presenterToken }) {
  if (!waitFor(code, (v) => v.participants.length === STUDENTS)) giveUp("Nem todos os alunos entraram");

  let current = act(code, presenterToken, "start");
  while (current.state !== "FIM") {
    const all = waitFor(code, (v) => v.votesReceived === STUDENTS);
    votesCounted.add(all !== null);
    if (!all) giveUp(`A votação do gato ${current.catNumber} não chegou a ${STUDENTS} votos`);

    const { result } = act(code, presenterToken, "reveal");
    check(result, { "placar soma todos os votos": (r) => r.guilty + r.innocent === STUDENTS });
    sleep(VERDICT_SECONDS);
    current = act(code, presenterToken, "next");
  }
  gameFinished.add(true);
}

const escapeXml = (text) =>
  text.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);

const ms = (value) => (value === undefined ? "-" : `${Math.round(value)} ms`);

// Resumo curto no console, JUnit com um caso por limite (thresholds) e o JSON completo
export function handleSummary(data) {
  const limits = Object.entries(data.metrics)
    .flatMap(([metric, { thresholds }]) =>
      Object.entries(thresholds ?? {}).map(([rule, { ok }]) => ({ name: `${metric} ${rule}`, ok })),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const lines = [`\nTeste de carga: ${STUDENTS} alunos\n`];
  for (const acao of ["consultar", "entrar", "votar", "imagem"]) {
    const values = data.metrics[`http_req_duration{acao:${acao}}`]?.values;
    if (!values?.count) {
      lines.push(`  ${acao.padEnd(10)} nenhuma requisição`);
      continue;
    }
    lines.push(`  ${acao.padEnd(10)} p95 ${ms(values["p(95)"]).padStart(7)}   máx ${ms(values.max).padStart(7)}   ${values.count} requisições`);
  }
  const failed = data.metrics.http_req_failed?.values.rate ?? 0;
  lines.push(`  falhas HTTP ${(failed * 100).toFixed(2).replace(".", ",")}%\n`, "Limites:");
  for (const { name, ok } of limits) lines.push(`  ${ok ? "ok   " : "FALHOU"} ${name}`);

  const failures = limits.filter((l) => !l.ok).length;
  const cases = limits.map(({ name, ok }) =>
    ok
      ? `    <testcase classname="carga" name="${escapeXml(name)}"/>`
      : `    <testcase classname="carga" name="${escapeXml(name)}"><failure message="limite não atingido"/></testcase>`,
  );
  const junit = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites><testsuite name="carga" tests="${limits.length}" failures="${failures}">`,
    ...cases,
    "</testsuite></testsuites>",
    "",
  ].join("\n");

  return {
    stdout: lines.join("\n") + "\n\n",
    "test-results/junit.xml": junit,
    "test-results/summary.json": JSON.stringify(data, null, 2),
  };
}
