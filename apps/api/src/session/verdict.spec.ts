import { describe, expect, it } from "vitest";
import { computeVerdict, tally } from "./verdict.js";

describe("tally", () => {
  it("conta os votos de cada lado", () => {
    expect(tally(["CULPADO", "INOCENTE", "CULPADO"])).toEqual({ guilty: 2, innocent: 1 });
  });

  it("zera quando não há votos", () => {
    expect(tally([])).toEqual({ guilty: 0, innocent: 0 });
  });
});

describe("computeVerdict", () => {
  it("condena com mais votos de culpado", () => {
    expect(computeVerdict({ guilty: 3, innocent: 2 })).toBe("CULPADO");
  });

  it("absolve com mais votos de inocente", () => {
    expect(computeVerdict({ guilty: 1, innocent: 4 })).toBe("INOCENTE");
  });

  it("absolve no empate", () => {
    expect(computeVerdict({ guilty: 2, innocent: 2 })).toBe("INOCENTE");
  });

  it("absolve quando ninguém votou", () => {
    expect(computeVerdict({ guilty: 0, innocent: 0 })).toBe("INOCENTE");
  });
});
