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
});
