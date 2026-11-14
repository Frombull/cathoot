import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveParticipant } from "@/lib/storage";
import { bolinha, json, mockFetch, sessionView } from "@/test/fixtures";
import { StudentRoom } from "./student-room";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
});

describe("StudentRoom", () => {
  it("sem nome nesta sala, manda para o formulário de entrada", () => {
    mockFetch(() => json(sessionView()));

    render(<StudentRoom code="ABC234" />);

    expect(router.replace).toHaveBeenCalledWith("/entrar?codigo=ABC234");
  });

  it("vota e mostra a confirmação", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    let voted = false;
    const fetchMock = mockFetch((method, path) => {
      if (method === "POST" && path === "/api/sessions/ABC234/votes") {
        voted = true;
        return new Response(null, { status: 204 });
      }
      return json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha, hasVoted: voted }));
    });

    render(<StudentRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Culpado" }));

    expect(await screen.findByText("Voto registrado!")).toBeTruthy();
    const voteCall = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(voteCall?.[1]?.body))).toEqual({ participantId: "p1", choice: "CULPADO" });
  });

  it("mostra o veredito revelado", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch(() =>
      json(
        sessionView({
          state: "RESULTADO",
          catNumber: 1,
          cat: bolinha,
          result: { guilty: 3, innocent: 1, verdict: "CULPADO" },
        }),
      ),
    );

    render(<StudentRoom code="ABC234" />);

    expect(await screen.findByText("Culpado!")).toBeTruthy();
  });

  it("avisa quando a sala não existe", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch(() => json({ code: "SESSION_NOT_FOUND", message: "Sala não encontrada" }, 404));

    render(<StudentRoom code="ABC234" />);

    expect(await screen.findByRole("heading", { name: "Sala não encontrada" })).toBeTruthy();
  });

  it("no lobby espera o juiz e mostra quantos já entraram", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch(() => json(sessionView({ participants: ["Ana", "Beto"] })));

    render(<StudentRoom code="ABC234" />);

    expect(await screen.findByRole("heading", { name: "Você está no tribunal, Ana!" })).toBeTruthy();
    expect(screen.getByText("2 pessoas na sala")).toBeTruthy();
  });

  it("se a sala esqueceu o participante (banco zerado), manda entrar de novo", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch(() => json({ code: "PARTICIPANT_NOT_FOUND", message: "Participante não encontrado" }, 404));

    render(<StudentRoom code="ABC234" />);

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/entrar?codigo=ABC234"));
    expect(localStorage.getItem("cathoot:participante:ABC234")).toBeNull();
  });

  it("mostra o erro do voto quando não é um caso esperado", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch((method) =>
      method === "POST"
        ? json({ code: "INTERNAL", message: "Deu ruim no servidor" }, 500)
        : json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha })),
    );

    render(<StudentRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Culpado" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Deu ruim no servidor");
  });

  it("voto repetido ou fora da hora não vira erro: a próxima consulta mostra a tela certa", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch((method) =>
      method === "POST"
        ? json({ code: "VOTING_CLOSED", message: "Votação fechada" }, 409)
        : json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha })),
    );

    render(<StudentRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Culpado" }));

    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Culpado" }).hasAttribute("disabled")).toBe(false));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    ["CULPADO", /A turma concordou com você!/],
    ["INOCENTE", /Dessa vez a turma pensou diferente\./],
  ] as const)("no veredito lembra o próprio voto (turma votou %s)", async (verdict, frase) => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    let revealed = false;
    mockFetch((method) => {
      if (method === "POST") {
        revealed = true;
        return new Response(null, { status: 204 });
      }
      return revealed
        ? json(sessionView({ state: "RESULTADO", catNumber: 1, cat: bolinha, result: { guilty: 1, innocent: 1, verdict } }))
        : json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha }));
    });

    render(<StudentRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Culpado" }));

    expect(await screen.findByText(frase)).toBeTruthy();
  });

  it("no fim mostra o resumo e agradece", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    mockFetch(() =>
      json(sessionView({ state: "FIM", summary: { prison: [bolinha], mostGuilty: null } })),
    );

    render(<StudentRoom code="ABC234" />);

    expect(await screen.findByText("Obrigado por julgar, Ana!")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Gatos condenados" }).textContent).toBe("Bolinha");
  });

  it("com a conexão instável, mantém a tela e avisa", async () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });
    let voted = false;
    mockFetch((method) => {
      if (method === "POST") {
        voted = true;
        return new Response(null, { status: 204 });
      }
      return voted
        ? new Response("<html>Bad Gateway</html>", { status: 502 })
        : json(sessionView({ state: "VOTANDO", catNumber: 1, cat: bolinha }));
    });

    render(<StudentRoom code="ABC234" />);
    await userEvent.click(await screen.findByRole("button", { name: "Culpado" }));

    expect(await screen.findByText("Conexão instável, tentando de novo...")).toBeTruthy();
    expect(screen.getByText("Voto registrado!")).toBeTruthy();
  });
});
