"use client";

import { useMemo, useSyncExternalStore } from "react";

// Identidade sem login: o participantId do aluno e o token do apresentador ficam no localStorage,
// um por sala. Assim recarregar a página ou escanear o QR de novo volta para a mesma pessoa.

export interface StoredParticipant {
  participantId: string;
  name: string;
}

const participantKey = (code: string) => `cathoot:participante:${code}`;
const presenterKey = (code: string) => `cathoot:apresentador:${code}`;

// O evento "storage" só chega nas outras abas; este avisa a aba atual
const CHANGE_EVENT = "cathoot:storage";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// undefined enquanto não dá para ler (no servidor e na hidratação); null quando não tem nada salvo
function useStoredItem(key: string) {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => undefined,
  );
}

export function parseParticipant(raw: string | null): StoredParticipant | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredParticipant>;
    if (typeof value.participantId === "string" && typeof value.name === "string") {
      return { participantId: value.participantId, name: value.name };
    }
  } catch {}
  return null;
}

export function saveParticipant(code: string, participant: StoredParticipant) {
  write(participantKey(code), JSON.stringify(participant));
}

export function forgetParticipant(code: string) {
  write(participantKey(code), null);
}

export function useParticipant(code: string): StoredParticipant | null | undefined {
  const raw = useStoredItem(participantKey(code));
  return useMemo(() => (raw === undefined ? undefined : parseParticipant(raw)), [raw]);
}

export function savePresenterToken(code: string, token: string) {
  write(presenterKey(code), token);
}

export function usePresenterToken(code: string) {
  return useStoredItem(presenterKey(code));
}
