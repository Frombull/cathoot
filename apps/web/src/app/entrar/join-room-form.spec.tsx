import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveParticipant } from "@/lib/storage";
import { json, mockFetch } from "@/test/fixtures";
import { JoinRoomForm } from "./join-room-form";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.push.mockReset();
});

describe("JoinRoomForm", () => {
  it("entra com o código digitado (em minúsculas) e guarda quem entrou", async () => {
    const fetchMock = mockFetch(() => json({ participantId: "p1", name: "Ana" }, 201));

    render(<JoinRoomForm initialCode="" />);
    await userEvent.type(screen.getByLabelText("Código da sala"), "abc234");
    await userEvent.type(screen.getByLabelText("Seu nome"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Entrar no tribunal" }));

    expect(router.push).toHaveBeenCalledWith("/sala/ABC234");
    expect(JSON.parse(localStorage.getItem("cathoot:participante:ABC234") ?? "null")).toEqual({
      participantId: "p1",
      name: "Ana",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions/ABC234/participants");
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Ana" });
  });

  it("vem com o código do QR preenchido", () => {
    render(<JoinRoomForm initialCode="ABC234" />);

    expect((screen.getByLabelText("Código da sala") as HTMLInputElement).value).toBe("ABC234");
  });

  it("com nome repetido, avisa e deixa tentar outro", async () => {
    mockFetch(() => json({ code: "PARTICIPANT_NAME_TAKEN", message: "Nome já usado" }, 409));

    render(<JoinRoomForm initialCode="ABC234" />);
    await userEvent.type(screen.getByLabelText("Seu nome"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Entrar no tribunal" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Já tem alguém com esse nome na sala. Que tal um apelido?",
    );
    expect(screen.getByLabelText("Seu nome").getAttribute("aria-invalid")).toBe("true");
    expect(router.push).not.toHaveBeenCalled();
  });

  it("trava o botão enquanto espera a API", async () => {
    let answer: (response: Response) => void = () => {};
    mockFetch(() => new Promise<Response>((resolve) => (answer = resolve)));

    render(<JoinRoomForm initialCode="ABC234" />);
    await userEvent.type(screen.getByLabelText("Seu nome"), "Ana");
    await userEvent.click(screen.getByRole("button", { name: "Entrar no tribunal" }));

    expect((await screen.findByRole("button", { name: "Entrando..." })).hasAttribute("disabled")).toBe(true);

    answer(json({ participantId: "p1", name: "Ana" }, 201));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalled());
  });

  it("quem já entrou nesta sala pode voltar direto para ela", () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });

    render(<JoinRoomForm initialCode="ABC234" />);

    expect(screen.getByText(/Você já está nessa sala como/).textContent).toContain("Ana");
    expect(screen.getByRole("link", { name: "Voltar para a sala" }).getAttribute("href")).toBe("/sala/ABC234");
  });
});
