import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bolinha, mingau } from "@/test/fixtures";
import { FinalSummary } from "./final-summary";

describe("FinalSummary", () => {
  it("mostra o gato mais culpado e os condenados na ordem do julgamento", () => {
    render(
      <FinalSummary
        totalCats={3}
        summary={{
          prison: [bolinha, mingau],
          mostGuilty: { cat: mingau, guilty: 5, innocent: 1, verdict: "CULPADO" },
        }}
      />,
    );

    expect(screen.getByText("2 gatos condenados de 3.")).toBeTruthy();
    expect(screen.getByText("5 votos de culpado")).toBeTruthy();
    const presos = within(screen.getByRole("list", { name: "Gatos condenados" })).getAllByRole("listitem");
    expect(presos.map((item) => item.textContent)).toEqual(["Bolinha", "Mingau"]);
  });

  it("sem condenados, a prisão fica vazia", () => {
    render(<FinalSummary totalCats={2} summary={{ prison: [], mostGuilty: null }} />);

    expect(screen.getByText("Ninguém votou culpado. Que turma boazinha!")).toBeTruthy();
    expect(screen.getByText("A prisão está vazia. Todos os gatos foram soltos!")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });
});
