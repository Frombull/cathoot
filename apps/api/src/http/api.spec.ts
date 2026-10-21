import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../app.module.js";
import { loadCatalog } from "../catalog/catalog.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { InMemorySessionRepository } from "../session/in-memory-session-repository.js";
import { SessionRepository } from "../session/session-repository.js";

let app: INestApplication;
let baseUrl: string;
const catalog = loadCatalog();

beforeAll(async () => {
  process.env.PRESENTER_PASSWORD = "miau";
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(SessionRepository)
    .useValue(new InMemorySessionRepository())
    .compile();
  app = moduleRef.createNestApplication();
  await app.listen(0, "127.0.0.1");
  baseUrl = await app.getUrl();
});

afterAll(() => app.close());

async function call(method: string, path: string, options: { body?: unknown; token?: string } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(options.body !== undefined && { "content-type": "application/json" }),
      ...(options.token && { "x-presenter-token": options.token }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : undefined };
}

async function novaSala() {
  const { body } = await call("POST", "/sessions", { body: { password: "miau" } });
  return body as { code: string; presenterToken: string };
}

describe("POST /sessions", () => {
  it("cria a sala com a senha certa", async () => {
    const response = await call("POST", "/sessions", { body: { password: "miau" } });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ code: expect.stringMatching(/^[A-Z2-9]{6}$/), presenterToken: expect.any(String) });
  });

  it("recusa senha errada com 401", async () => {
    const response = await call("POST", "/sessions", { body: { password: "errada" } });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: "PRESENTER_UNAUTHORIZED", message: expect.any(String) });
  });

  it("recusa corpo sem senha com 400", async () => {
    expect((await call("POST", "/sessions", { body: {} })).status).toBe(400);
    expect((await call("POST", "/sessions", { body: { password: 123 } })).status).toBe(400);
    expect((await call("POST", "/sessions")).status).toBe(400);
  });
});

describe("GET /sessions/:code", () => {
  it("mostra o estado da sala sem cache", async () => {
    const { code } = await novaSala();

    const response = await call("GET", `/sessions/${code}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.body).toMatchObject({ code, state: "LOBBY", participants: [], totalCats: catalog.length });
  });

  it("devolve 404 para sala que não existe", async () => {
    const response = await call("GET", "/sessions/NADA22");

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("SESSION_NOT_FOUND");
  });

  it("informa se o participante já votou", async () => {
    const { code, presenterToken } = await novaSala();
    const ana = (await call("POST", `/sessions/${code}/participants`, { body: { name: "Ana" } })).body;
    await call("POST", `/sessions/${code}/start`, { token: presenterToken });
    expect((await call("GET", `/sessions/${code}?participantId=${ana.participantId}`)).body.hasVoted).toBe(false);

    await call("POST", `/sessions/${code}/votes`, { body: { participantId: ana.participantId, choice: "CULPADO" } });

    expect((await call("GET", `/sessions/${code}?participantId=${ana.participantId}`)).body.hasVoted).toBe(true);
    expect((await call("GET", `/sessions/${code}?participantId=fantasma`)).status).toBe(404);
  });
});

describe("POST /sessions/:code/participants", () => {
  it("entra na sala e devolve o id", async () => {
    const { code } = await novaSala();

    const response = await call("POST", `/sessions/${code}/participants`, { body: { name: "Ana" } });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ participantId: expect.any(String), name: "Ana" });
  });

  it("recusa nome repetido com 409 e nome vazio com 400", async () => {
    const { code } = await novaSala();
    await call("POST", `/sessions/${code}/participants`, { body: { name: "Ana" } });

    const repetido = await call("POST", `/sessions/${code}/participants`, { body: { name: "ana" } });
    const vazio = await call("POST", `/sessions/${code}/participants`, { body: { name: "  " } });
    const ausente = await call("POST", `/sessions/${code}/participants`, { body: {} });

    expect([repetido.status, repetido.body.code]).toEqual([409, "PARTICIPANT_NAME_TAKEN"]);
    expect([vazio.status, vazio.body.code]).toEqual([400, "PARTICIPANT_NAME_REQUIRED"]);
    expect(ausente.status).toBe(400);
  });
});

describe("rodada completa", () => {
  it("cadastra, vota e vê o veredito de cada gato até o resumo", async () => {
    const { code, presenterToken } = await novaSala();
    const entrar = async (name: string) => (await call("POST", `/sessions/${code}/participants`, { body: { name } })).body.participantId;
    const [ana, beto, caio] = [await entrar("Ana"), await entrar("Beto"), await entrar("Caio")];

    for (const [indice, gato] of catalog.entries()) {
      const aberta = await call("POST", `/sessions/${code}/${indice === 0 ? "start" : "next"}`, { token: presenterToken });
      expect(aberta.body).toMatchObject({ state: "VOTANDO", catNumber: indice + 1, cat: { name: gato.name, imageUrl: gato.imageUrl } });

      const votos = [ana, beto, caio].map((participantId, i) =>
        call("POST", `/sessions/${code}/votes`, { body: { participantId, choice: i < 2 ? "CULPADO" : "INOCENTE" } }),
      );
      expect((await Promise.all(votos)).map((r) => r.status)).toEqual([204, 204, 204]);

      const revelada = await call("POST", `/sessions/${code}/reveal`, { token: presenterToken });
      expect(revelada.body).toMatchObject({ state: "RESULTADO", result: { guilty: 2, innocent: 1, verdict: "CULPADO" } });
    }

    const fim = await call("POST", `/sessions/${code}/next`, { token: presenterToken });
    expect(fim.body.state).toBe("FIM");
    expect(fim.body.summary.prison.map((c: { name: string }) => c.name)).toEqual(catalog.map((c) => c.name));
  });
});

describe("votos", () => {
  it("devolve 409 para voto repetido e fora da votação, 400 para escolha inválida, 404 para quem não entrou", async () => {
    const { code, presenterToken } = await novaSala();
    const { participantId } = (await call("POST", `/sessions/${code}/participants`, { body: { name: "Ana" } })).body;
    const votar = (body: unknown) => call("POST", `/sessions/${code}/votes`, { body });

    expect((await votar({ participantId, choice: "CULPADO" })).body.code).toBe("VOTING_CLOSED");
    await call("POST", `/sessions/${code}/start`, { token: presenterToken });

    expect((await votar({ participantId, choice: "TALVEZ" })).status).toBe(400);
    expect((await votar({ participantId: "fantasma", choice: "CULPADO" })).status).toBe(404);
    expect((await votar({ choice: "CULPADO" })).status).toBe(400);
    expect((await votar({ participantId, choice: "CULPADO" })).status).toBe(204);
    expect((await votar({ participantId, choice: "INOCENTE" })).status).toBe(409);
  });
});

describe("ações do apresentador", () => {
  it("exigem o token da sala (401 sem ele ou com outro)", async () => {
    const { code } = await novaSala();
    const outra = await novaSala();

    for (const acao of ["start", "reveal", "next"]) {
      expect((await call("POST", `/sessions/${code}/${acao}`)).status).toBe(401);
      expect((await call("POST", `/sessions/${code}/${acao}`, { token: outra.presenterToken })).status).toBe(401);
    }
    expect((await call("GET", `/sessions/${code}`)).body.state).toBe("LOBBY");
  });

  it("devolve 409 numa transição inválida", async () => {
    const { code, presenterToken } = await novaSala();

    const response = await call("POST", `/sessions/${code}/reveal`, { token: presenterToken });

    expect([response.status, response.body.code]).toEqual([409, "INVALID_STATE_TRANSITION"]);
  });
});

describe("gatos do catálogo", () => {
  it("GET /cats lista os gatos", async () => {
    const response = await call("GET", "/cats");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(catalog.length);
    expect(response.body[0]).toEqual({ id: catalog[0].id, name: catalog[0].name, crime: catalog[0].crime, imageUrl: catalog[0].imageUrl });
  });

  it("serve a imagem de cada gato", async () => {
    for (const gato of catalog) {
      const response = await fetch(baseUrl + gato.imageUrl);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toMatch(/^image\/(jpeg|png)/);
      expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    }
  });

  it("devolve 404 para imagem que não existe e para nomes fora do padrão", async () => {
    for (const path of ["/cats/999.jpg", "/cats/gatos.yaml", "/cats/README.md", "/cats/..%2Fpackage.json"]) {
      expect((await fetch(baseUrl + path)).status).toBe(404);
    }
  });
});
