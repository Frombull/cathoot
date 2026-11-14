import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CriarPage from "./criar/page";
import EntrarPage from "./entrar/page";
import NotFound from "./not-found";
import Home from "./page";
import ApresentadorPage, { generateMetadata as apresentadorMetadata } from "./sala/[codigo]/apresentador/page";
import { PresenterRoom } from "./sala/[codigo]/apresentador/presenter-room";
import SalaPage, { generateMetadata as salaMetadata } from "./sala/[codigo]/page";
import { StudentRoom } from "./sala/[codigo]/student-room";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));

const salaProps = (codigo: string) => ({ params: Promise.resolve({ codigo }), searchParams: Promise.resolve({}) });
const entrarProps = (query: Record<string, string | string[]>) => ({
  params: Promise.resolve({}),
  searchParams: Promise.resolve(query),
});

describe("páginas", () => {
  it("a landing leva a criar sala e tem o formulário do código (funciona sem JS)", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Julgue gatos.");
    expect(screen.getByRole("link", { name: "Criar sala" }).getAttribute("href")).toBe("/criar");
    const codigo = screen.getByRole("textbox", { name: "Código da sala" });
    expect(codigo.getAttribute("name")).toBe("codigo");
    expect(codigo.closest("form")?.getAttribute("action")).toBe("/entrar");
  });

  it("o 404 mostra o gato escondido e volta para o início", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "Esse gato se escondeu." })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voltar para o início" }).getAttribute("href")).toBe("/");
  });

  it("criar sala pede a senha do apresentador", () => {
    render(<CriarPage />);

    expect(screen.getByRole("heading", { name: "Abrir o tribunal" })).toBeTruthy();
    expect(screen.getByLabelText("Senha do apresentador")).toBeTruthy();
  });

  it("entrar já vem com o código do QR, normalizado", async () => {
    render(await EntrarPage(entrarProps({ codigo: " abc234 " })));

    expect((screen.getByLabelText("Código da sala") as HTMLInputElement).value).toBe("ABC234");
  });

  it("entrar sem código (ou com o código repetido na URL) começa vazio", async () => {
    render(await EntrarPage(entrarProps({ codigo: ["AAA222", "BBB333"] })));

    expect((screen.getByLabelText("Código da sala") as HTMLInputElement).value).toBe("");
  });

  it("a sala do aluno e o telão recebem o código normalizado", async () => {
    const aluno = await SalaPage(salaProps("abc234"));
    const telao = await ApresentadorPage(salaProps("abc234"));

    expect(aluno.type).toBe(StudentRoom);
    expect(aluno.props).toEqual({ code: "ABC234" });
    expect(telao.type).toBe(PresenterRoom);
    expect(telao.props).toEqual({ code: "ABC234" });
  });

  it("o título da aba mostra o código da sala", async () => {
    expect(await salaMetadata(salaProps("abc234"))).toEqual({ title: "Sala ABC234" });
    expect(await apresentadorMetadata(salaProps("abc234"))).toEqual({ title: "Telão da sala ABC234" });
  });
});
