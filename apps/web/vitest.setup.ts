import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Sem os globals do Vitest, o Testing Library não desmonta sozinho entre os testes
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
