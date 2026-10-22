import { vi } from "vitest";
import type { Cat, SessionView } from "@/lib/api";

export const bolinha: Cat = { name: "Bolinha", imageUrl: "/cats/1.jpg", crime: "Bebeu água do esgoto" };
export const mingau: Cat = { name: "Mingau", imageUrl: "/cats/2.jpg", crime: "Roubou o peixe do jantar" };

export function sessionView(overrides: Partial<SessionView> = {}): SessionView {
  return {
    code: "ABC234",
    state: "LOBBY",
    participants: [],
    totalCats: 2,
    catNumber: null,
    cat: null,
    votesReceived: 0,
    result: null,
    summary: null,
    ...overrides,
  };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// fetch falso: cada chamada responde com o que o handler devolver para (método, caminho)
export function mockFetch(handler: (method: string, path: string, init?: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(init?.method ?? "GET", String(input), init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
