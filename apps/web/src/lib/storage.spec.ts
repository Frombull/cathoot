import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  forgetParticipant,
  parseParticipant,
  saveParticipant,
  savePresenterToken,
  useParticipant,
  usePresenterToken,
} from "./storage";

describe("parseParticipant", () => {
  it("lê o participante salvo", () => {
    expect(parseParticipant('{"participantId":"p1","name":"Ana"}')).toEqual({ participantId: "p1", name: "Ana" });
  });

  it("ignora valor vazio, quebrado ou incompleto", () => {
    expect(parseParticipant(null)).toBeNull();
    expect(parseParticipant("{quebrado")).toBeNull();
    expect(parseParticipant('{"name":"Ana"}')).toBeNull();
  });
});

describe("useParticipant", () => {
  it("começa vazio e acompanha o que é salvo e esquecido na mesma aba", () => {
    const { result } = renderHook(() => useParticipant("ABC234"));
    expect(result.current).toBeNull();

    act(() => saveParticipant("ABC234", { participantId: "p1", name: "Ana" }));
    expect(result.current).toEqual({ participantId: "p1", name: "Ana" });

    act(() => forgetParticipant("ABC234"));
    expect(result.current).toBeNull();
  });

  it("guarda uma identidade por sala", () => {
    saveParticipant("ABC234", { participantId: "p1", name: "Ana" });

    const { result } = renderHook(() => useParticipant("XYZ789"));

    expect(result.current).toBeNull();
  });
});

describe("usePresenterToken", () => {
  it("devolve o token da sala", () => {
    const { result } = renderHook(() => usePresenterToken("ABC234"));
    expect(result.current).toBeNull();

    act(() => savePresenterToken("ABC234", "segredo"));

    expect(result.current).toBe("segredo");
  });
});
