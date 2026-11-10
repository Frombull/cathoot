import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { savePresenterToken } from "@/lib/storage";
import { bolinha, json, mockFetch, sessionView } from "@/test/fixtures";
import { PresenterRoom } from "./presenter-room";

describe("PresenterRoom", () => {
  it("no lobby mostra o QR code, o código e quem já entrou", async () => {
    mockFetch(() => json(sessionView({ participants: ["Ana", "Beto"] })));

    render(<PresenterRoom code="ABC234" />);

    expect(await screen.findByTitle("QR code para entrar na sala")).toBeTruthy();
    expect(screen.getAllByText("ABC234").length).toBeGreaterThan(0);
    expect(screen.getByRole("list", { name: "Participantes" }).textContent).toBe("AnaBeto");
  });

  it("com o token, começa o julgamento e mostra o primeiro gato", async () => {
    savePresenterToken("ABC234", "segredo");
    const fetchMock = mockFetch((method) =>
      method === "POST"
        ? json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha, participants: ["Ana"] }))
        : json(sessionView({ participants: ["Ana"] })),
    );

    render(<PresenterRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Começar julgamento" }));

    expect(await screen.findByRole("heading", { name: "Bolinha" })).toBeTruthy();
    expect(screen.getByText("0 de 1 pessoa votou")).toBeTruthy();
    const startCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(startCall?.[0]).toBe("/api/sessions/ABC234/start");
    expect(startCall?.[1]?.headers).toMatchObject({ "x-presenter-token": "segredo" });
  });

  it("sem o token é só telão: não mostra os botões", async () => {
    mockFetch(() => json(sessionView({ participants: ["Ana"] })));

    render(<PresenterRoom code="ABC234" />);

    expect(await screen.findByText(/Modo telão/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Começar julgamento" })).toBeNull();
  });

  it("no último gato o botão leva ao resumo", async () => {
    savePresenterToken("ABC234", "segredo");
    mockFetch(() =>
      json(
        sessionView({
          state: "RESULTADO",
          catNumber: 2,
          totalCats: 2,
          cat: bolinha,
          result: { guilty: 0, innocent: 1, verdict: "INOCENTE" },
        }),
      ),
    );

    render(<PresenterRoom code="ABC234" />);

    expect(await screen.findByRole("button", { name: "Ver resumo final" })).toBeTruthy();
  });

  it("no lobby vazio espera a turma escanear", async () => {
    mockFetch(() => json(sessionView()));

    render(<PresenterRoom code="ABC234" />);

    expect(await screen.findByText("Esperando a turma escanear o QR code...")).toBeTruthy();
  });

  it("avisa quando a sala não existe e oferece criar outra", async () => {
    mockFetch(() => json({ code: "SESSION_NOT_FOUND", message: "Sala não encontrada" }, 404));

    render(<PresenterRoom code="ABC234" />);

    expect(await screen.findByRole("heading", { name: "Sala não encontrada" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Criar outra sala" }).getAttribute("href")).toBe("/criar");
  });

  it("revela o veredito durante a votação", async () => {
    savePresenterToken("ABC234", "segredo");
    const fetchMock = mockFetch((method) =>
      method === "POST"
        ? json(
            sessionView({
              state: "RESULTADO",
              catNumber: 1,
              cat: bolinha,
              participants: ["Ana"],
              result: { guilty: 1, innocent: 0, verdict: "CULPADO" },
            }),
          )
        : json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha, participants: ["Ana"], votesReceived: 1 })),
    );

    render(<PresenterRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Revelar veredito" }));

    expect(await screen.findByRole("button", { name: "Próximo gato" })).toBeTruthy();
    expect(fetchMock.mock.calls.find(([, init]) => init?.method === "POST")?.[0]).toBe("/api/sessions/ABC234/reveal");
  });

  it("mostra o erro de uma ação que falhou", async () => {
    savePresenterToken("ABC234", "token-velho");
    mockFetch((method) =>
      method === "POST"
        ? json({ code: "PRESENTER_UNAUTHORIZED", message: "Token inválido" }, 401)
        : json(sessionView({ participants: ["Ana"] })),
    );

    render(<PresenterRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Começar julgamento" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Senha errada! Só o juiz pode abrir o tribunal.");
  });

  it("clique duplo (outra aba já avançou) só atualiza a tela, e avisa se a conexão cair", async () => {
    savePresenterToken("ABC234", "segredo");
    let clicked = false;
    const fetchMock = mockFetch((method) => {
      if (method === "POST") {
        clicked = true;
        return json({ code: "INVALID_STATE_TRANSITION", message: "Já começou" }, 409);
      }
      return clicked
        ? new Response("<html>Bad Gateway</html>", { status: 502 })
        : json(sessionView({ participants: ["Ana"] }));
    });

    render(<PresenterRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Começar julgamento" }));

    expect(await screen.findByText("Conexão instável, tentando de novo...")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "GET").length).toBeGreaterThanOrEqual(2);
  });

  it("no fim mostra o resumo e oferece um novo julgamento", async () => {
    savePresenterToken("ABC234", "segredo");
    mockFetch(() => json(sessionView({ state: "FIM", summary: { prison: [], mostGuilty: null } })));

    render(<PresenterRoom code="ABC234" />);

    expect((await screen.findByRole("link", { name: "Novo julgamento" })).getAttribute("href")).toBe("/criar");
  });
});
