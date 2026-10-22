import { describe, expect, it } from "vitest";
import { json, mockFetch, sessionView } from "@/test/fixtures";
import { api, ApiError, errorMessage, normalizeRoomCode } from "./api";

describe("api", () => {
  it("consulta a sala pelo /api, sem cache, com o participante na query", async () => {
    const fetchMock = mockFetch(() => json(sessionView()));

    const view = await api.getSession("ABC234", "id com espaço");

    expect(view.code).toBe("ABC234");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions/ABC234?participantId=id%20com%20espa%C3%A7o");
    expect(init).toMatchObject({ method: "GET", cache: "no-store" });
  });

  it("manda o corpo em JSON", async () => {
    const fetchMock = mockFetch(() => json({ participantId: "p1", name: "Ana" }, 201));

    await expect(api.join("ABC234", "Ana")).resolves.toEqual({ participantId: "p1", name: "Ana" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions/ABC234/participants");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "content-type": "application/json" });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Ana" });
  });

  it("manda o token do apresentador no header", async () => {
    const fetchMock = mockFetch(() => json(sessionView({ state: "VOTANDO" })));

    await api.start("ABC234", "segredo");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions/ABC234/start");
    expect(init?.headers).toMatchObject({ "x-presenter-token": "segredo" });
  });

  it("aceita resposta sem corpo (voto é 204)", async () => {
    mockFetch(() => new Response(null, { status: 204 }));

    await expect(api.vote("ABC234", "p1", "CULPADO")).resolves.toBeUndefined();
  });

  it("transforma o erro da API em ApiError com o código", async () => {
    mockFetch(() => json({ code: "ALREADY_VOTED", message: "Cada participante vota uma vez por gato" }, 409));

    const error = await api.vote("ABC234", "p1", "CULPADO").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "ALREADY_VOTED", status: 409, message: "Cada participante vota uma vez por gato" });
  });

  it("aguenta erro sem JSON (API fora do ar atrás do proxy)", async () => {
    mockFetch(() => new Response("<html>Bad Gateway</html>", { status: 502 }));

    await expect(api.getSession("ABC234")).rejects.toMatchObject({ code: "UNKNOWN", status: 502 });
  });

  it("falha de rede vira NETWORK", async () => {
    mockFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    await expect(api.getSession("ABC234")).rejects.toMatchObject({ code: "NETWORK" });
  });
});

describe("errorMessage", () => {
  it("troca algumas mensagens por uma mais divertida", () => {
    expect(errorMessage(new ApiError("PRESENTER_UNAUTHORIZED", "Senha ou token do apresentador inválido"))).toBe(
      "Senha errada! Só o juiz pode abrir o tribunal.",
    );
  });

  it("usa a mensagem da API nos outros códigos", () => {
    expect(errorMessage(new ApiError("PARTICIPANT_NAME_REQUIRED", "Digite um nome"))).toBe("Digite um nome");
  });

  it("tem uma mensagem genérica para erro desconhecido", () => {
    expect(errorMessage(new Error("boom"))).toBe("Algo deu errado no tribunal. Tente de novo.");
  });
});

describe("normalizeRoomCode", () => {
  it("tira os espaços das pontas e põe em maiúsculas, como a API", () => {
    expect(normalizeRoomCode("  abc234 ")).toBe("ABC234");
  });
});
