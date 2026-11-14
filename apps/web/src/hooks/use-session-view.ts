"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type SessionView } from "@/lib/api";

export const POLL_INTERVAL_MS = 1500;

// Erros que não melhoram tentando de novo
const FATAL = new Set(["SESSION_NOT_FOUND", "PARTICIPANT_NOT_FOUND"]);

// Consulta a sala a cada ~1,5 s (sem WebSocket), uma consulta por vez. Para no FIM, que não muda
// mais, e em erro fatal. Erro passageiro (rede, API reiniciando) mantém a última tela e tenta de novo.
export function useSessionView(code: string, participantId?: string, enabled = true) {
  const [view, setView] = useState<SessionView | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  // Cada consulta pega um número; as que saíram antes de um apply chegam velhas e são ignoradas
  const lastTicket = useRef(0);
  const staleUpTo = useRef(0);
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let again = false;

    async function poll() {
      clearTimeout(timer);
      if (inFlight) {
        again = true;
        return;
      }
      inFlight = true;
      const ticket = ++lastTicket.current;
      let keepGoing = true;
      try {
        const next = await api.getSession(code, participantId);
        if (!stopped && ticket > staleUpTo.current) {
          setView(next);
          setError(null);
          keepGoing = next.state !== "FIM";
        }
      } catch (caught) {
        if (!stopped && ticket > staleUpTo.current) {
          const apiError = caught instanceof ApiError ? caught : new ApiError("UNKNOWN", String(caught));
          setError(apiError);
          keepGoing = !FATAL.has(apiError.code);
        }
      } finally {
        inFlight = false;
      }
      if (stopped) return;
      if (again) {
        again = false;
        void poll();
      } else if (keepGoing) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    refreshRef.current = () => void poll();
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      refreshRef.current = () => {};
    };
  }, [code, participantId, enabled]);

  // Para quando uma ação já devolveu a sala atualizada (start, reveal, next)
  const apply = useCallback((next: SessionView) => {
    staleUpTo.current = lastTicket.current;
    setView(next);
    setError(null);
  }, []);

  // Consulta agora, sem esperar o próximo ciclo (depois de votar, por exemplo)
  const refresh = useCallback(() => refreshRef.current(), []);

  return { view, error, apply, refresh };
}
