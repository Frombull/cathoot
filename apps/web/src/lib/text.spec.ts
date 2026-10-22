import { describe, expect, it } from "vitest";
import { percent, plural } from "./text";

describe("plural", () => {
  it("usa o singular só para 1", () => {
    expect(plural(1, "voto", "votos")).toBe("1 voto");
    expect(plural(0, "voto", "votos")).toBe("0 votos");
    expect(plural(2, "voto", "votos")).toBe("2 votos");
  });
});

describe("percent", () => {
  it("arredonda a fração", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(3, 3)).toBe(100);
  });

  it("não divide por zero", () => {
    expect(percent(0, 0)).toBe(0);
  });
});
