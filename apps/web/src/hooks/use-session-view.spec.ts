import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionView } from "@/lib/api";
import { json, mockFetch, sessionView } from "@/test/fixtures";
import { POLL_INTERVAL_MS, useSessionView } from "./use-session-view";

// Avança o relógio falso e deixa as promessas do fetch resolverem
const tick = (ms = 0) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

describe("useSessionView", () => {
  it("consulta na hora e depois a cada 1,5 s", async () => {
    const fetchMock = mockFetch(() => json(sessionView({ participants: ["Ana"] })));

    const { result } = renderHook(() => useSessionView("ABC234", "p1"));
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/sessions/ABC234?participantId=p1");
    expect(result.current.view?.participants).toEqual(["Ana"]);

    await tick(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await tick(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("para de consultar no FIM", async () => {
    const fetchMock = mockFetch(() => json(sessionView({ state: "FIM" })));

    renderHook(() => useSessionView("ABC234"));
    await tick();
    await tick(POLL_INTERVAL_MS * 3);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("para quando a sala não existe", async () => {
    const fetchMock = mockFetch(() => json({ code: "SESSION_NOT_FOUND", message: "Sala não encontrada" }, 404));

    const { result } = renderHook(() => useSessionView("ABC234"));
    await tick();
    await tick(POLL_INTERVAL_MS * 3);

    expect(result.current.error?.code).toBe("SESSION_NOT_FOUND");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("em erro passageiro mantém a última tela e tenta de novo", async () => {
    let fail = false;
    const fetchMock = mockFetch(() => (fail ? Promise.reject(new TypeError("offline")) : json(sessionView())));

    const { result } = renderHook(() => useSessionView("ABC234"));
    await tick();
    fail = true;
    await tick(POLL_INTERVAL_MS);

    expect(result.current.error?.code).toBe("NETWORK");
    expect(result.current.view?.state).toBe("LOBBY");

    fail = false;
    await tick(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBeNull();
  });

  it("não consulta enquanto estiver desligado", async () => {
    const fetchMock = mockFetch(() => json(sessionView()));

    renderHook(() => useSessionView("ABC234", undefined, false));
    await tick(POLL_INTERVAL_MS * 2);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("descarta a consulta que saiu antes de um apply, sem parar o polling", async () => {
    // A primeira consulta demora; no meio dela o apresentador avança e a ação devolve a sala nova
    let respond: ((response: Response) => void) | undefined;
    const fetchMock = mockFetch(() => new Promise<Response>((resolve) => (respond = resolve)));

    const { result } = renderHook(() => useSessionView("ABC234"));
    await tick();
    act(() => result.current.apply(sessionView({ state: "VOTANDO" })));
    await act(async () => respond?.(json(sessionView({ state: "LOBBY" }))));
    await tick();

    expect(result.current.view?.state).toBe("VOTANDO");

    await tick(POLL_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refresh consulta na hora", async () => {
    const views: SessionView[] = [sessionView(), sessionView({ votesReceived: 1 })];
    const fetchMock = mockFetch(() => json(views.shift() ?? sessionView({ votesReceived: 1 })));

    const { result } = renderHook(() => useSessionView("ABC234"));
    await tick();
    act(() => result.current.refresh());
    await tick();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.view?.votesReceived).toBe(1);
  });
});
