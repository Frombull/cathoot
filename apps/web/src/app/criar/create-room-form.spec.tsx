import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { json, mockFetch } from "@/test/fixtures";
import { CreateRoomForm } from "./create-room-form";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

beforeEach(() => {
  router.push.mockReset();
});

describe("CreateRoomForm", () => {
  it("cria a sala, guarda o token do apresentador e vai para o telão", async () => {
    const fetchMock = mockFetch(() => json({ code: "ABC234", presenterToken: "segredo" }, 201));

    render(<CreateRoomForm />);
    await userEvent.type(screen.getByLabelText("Senha do apresentador"), "miau");
    await userEvent.click(screen.getByRole("button", { name: "Abrir o tribunal" }));

    expect(router.push).toHaveBeenCalledWith("/sala/ABC234/apresentador");
    expect(localStorage.getItem("cathoot:apresentador:ABC234")).toBe("segredo");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/sessions");
    expect(JSON.parse(String(init?.body))).toEqual({ password: "miau" });
  });

  it("com a senha errada, avisa e deixa tentar de novo", async () => {
    mockFetch(() => json({ code: "PRESENTER_UNAUTHORIZED", message: "Senha inválida" }, 401));

    render(<CreateRoomForm />);
    await userEvent.type(screen.getByLabelText("Senha do apresentador"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Abrir o tribunal" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Senha errada! Só o juiz pode abrir o tribunal.");
    expect(screen.getByLabelText("Senha do apresentador").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("button", { name: "Abrir o tribunal" }).hasAttribute("disabled")).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });

  it("trava o botão enquanto espera a API", async () => {
    let answer: (response: Response) => void = () => {};
    mockFetch(() => new Promise<Response>((resolve) => (answer = resolve)));

    render(<CreateRoomForm />);
    await userEvent.type(screen.getByLabelText("Senha do apresentador"), "miau");
    await userEvent.click(screen.getByRole("button", { name: "Abrir o tribunal" }));

    const button = await screen.findByRole("button", { name: "Abrindo o tribunal..." });
    expect(button.hasAttribute("disabled")).toBe(true);

    answer(json({ code: "ABC234", presenterToken: "segredo" }, 201));
    await vi.waitFor(() => expect(router.push).toHaveBeenCalled());
  });
});
