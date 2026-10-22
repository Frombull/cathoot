import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bolinha } from "@/test/fixtures";
import { VerdictBoard } from "./verdict-board";

describe("VerdictBoard", () => {
  it("carimba CULPADO e manda para a Prisão da Soneca", () => {
    render(<VerdictBoard cat={bolinha} result={{ guilty: 2, innocent: 1, verdict: "CULPADO" }} />);

    expect(screen.getByRole("status").textContent).toBe("Culpado!");
    expect(screen.getByText("Bolinha vai para a Prisão da Soneca.")).toBeTruthy();
    expect(screen.getByText("2 votos")).toBeTruthy();
    expect(screen.getByText("1 voto")).toBeTruthy();
  });

  it("no empate solta o gato", () => {
    render(<VerdictBoard cat={bolinha} result={{ guilty: 1, innocent: 1, verdict: "INOCENTE" }} />);

    expect(screen.getByRole("status").textContent).toBe("Inocente!");
    expect(screen.getByText("Empate! Na dúvida, solta o gato.")).toBeTruthy();
  });

  it("sem votos também solta o gato", () => {
    render(<VerdictBoard cat={bolinha} result={{ guilty: 0, innocent: 0, verdict: "INOCENTE" }} />);

    expect(screen.getByText("Ninguém votou. Na dúvida, solta o gato!")).toBeTruthy();
  });
});
