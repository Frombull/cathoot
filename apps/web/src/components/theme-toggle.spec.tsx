import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

const root = document.documentElement;
const botao = () => screen.getByRole("button", { name: "Alternar tema claro e escuro" });

// O jsdom não tem View Transitions nem matchMedia: cada teste liga o que precisa
function ligarTransicoes(reducedMotion = false) {
  const efeitos: (string | null)[] = [];
  const startViewTransition = vi.fn((update: () => void) => {
    efeitos.push(root.getAttribute("data-vt"));
    update();
    return { finished: Promise.resolve() };
  });
  Object.defineProperty(document, "startViewTransition", { value: startViewTransition, configurable: true });
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reducedMotion, media: query }));
  return { startViewTransition, efeitos };
}

beforeEach(() => {
  root.setAttribute("data-theme", "light");
});

afterEach(() => {
  Reflect.deleteProperty(document, "startViewTransition");
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("alterna entre claro e escuro e lembra a escolha", async () => {
    render(<ThemeToggle />);

    await userEvent.click(botao());
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");

    await userEvent.click(botao());
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("troca mesmo se o navegador bloquear o localStorage", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    render(<ThemeToggle />);

    await userEvent.click(botao());

    expect(root.getAttribute("data-theme")).toBe("dark");
  });

  it("com View Transitions, usa um efeito diferente a cada clique e limpa no fim", async () => {
    const { startViewTransition, efeitos } = ligarTransicoes();
    render(<ThemeToggle />);

    for (let i = 0; i < 3; i++) await userEvent.click(botao());

    expect(startViewTransition).toHaveBeenCalledTimes(3);
    expect(new Set(efeitos)).toEqual(new Set(["rectangle", "circle-blur", "blinds"]));
    expect(root.getAttribute("data-theme")).toBe("dark");
    await vi.waitFor(() => expect(root.hasAttribute("data-vt")).toBe(false));
  });

  it("quem pediu menos movimento troca sem animação", async () => {
    const { startViewTransition } = ligarTransicoes(true);
    render(<ThemeToggle />);

    await userEvent.click(botao());

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(root.getAttribute("data-theme")).toBe("dark");
  });
});
