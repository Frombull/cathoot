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
});
