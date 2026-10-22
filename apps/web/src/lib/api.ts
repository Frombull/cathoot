// Cliente da API (apps/api). O Next repassa /api/* para ela (rewrites no next.config.ts),
// então o navegador só fala com a própria origem. Tipos espelham docs/api.md.

export type SessionState = "LOBBY" | "VOTANDO" | "RESULTADO" | "FIM";
export type VoteChoice = "CULPADO" | "INOCENTE";

export interface Cat {
  name: string;
  imageUrl: string;
  crime: string;
}

export interface CatResult {
  cat: Cat;
  guilty: number;
  innocent: number;
  verdict: VoteChoice;
}

export interface SessionView {
  code: string;
  state: SessionState;
  participants: string[];
  totalCats: number;
  catNumber: number | null;
  cat: Cat | null;
  votesReceived: number;
  hasVoted?: boolean;
  result: { guilty: number; innocent: number; verdict: VoteChoice } | null;
  summary: { prison: Cat[]; mostGuilty: CatResult | null } | null;
}

// Mesmo formato de erro da API ({ code, message }); NETWORK é quando nem chegou resposta
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NETWORK_MESSAGE = "Não deu para falar com o tribunal. Confira a internet e tente de novo.";

interface RequestOptions {
  body?: unknown;
  presenterToken?: string;
}

async function request<T>(method: string, path: string, { body, presenterToken }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      cache: "no-store",
      headers: {
        ...(body !== undefined && { "content-type": "application/json" }),
        ...(presenterToken && { "x-presenter-token": presenterToken }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("NETWORK", NETWORK_MESSAGE);
  }

  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const error = data as { code?: unknown; message?: unknown } | undefined;
    throw new ApiError(
      typeof error?.code === "string" ? error.code : "UNKNOWN",
      typeof error?.message === "string" ? error.message : "Algo deu errado no tribunal. Tente de novo.",
      response.status,
    );
  }
  return data as T;
}

const room = (code: string) => `/sessions/${encodeURIComponent(code)}`;

export const api = {
  createSession: (password: string) =>
    request<{ code: string; presenterToken: string }>("POST", "/sessions", { body: { password } }),

  getSession: (code: string, participantId?: string) =>
    request<SessionView>(
      "GET",
      participantId ? `${room(code)}?participantId=${encodeURIComponent(participantId)}` : room(code),
    ),

  join: (code: string, name: string) =>
    request<{ participantId: string; name: string }>("POST", `${room(code)}/participants`, { body: { name } }),

  vote: (code: string, participantId: string, choice: VoteChoice) =>
    request<void>("POST", `${room(code)}/votes`, { body: { participantId, choice } }),

  start: (code: string, presenterToken: string) =>
    request<SessionView>("POST", `${room(code)}/start`, { presenterToken }),

  reveal: (code: string, presenterToken: string) =>
    request<SessionView>("POST", `${room(code)}/reveal`, { presenterToken }),

  next: (code: string, presenterToken: string) =>
    request<SessionView>("POST", `${room(code)}/next`, { presenterToken }),
};

// A API já manda mensagens em português; aqui só ficam as que merecem um tom mais de brincadeira
const FRIENDLY: Record<string, string> = {
  PRESENTER_UNAUTHORIZED: "Senha errada! Só o juiz pode abrir o tribunal.",
  SESSION_NOT_FOUND: "Não achamos essa sala. Confere o código?",
  PARTICIPANT_NAME_TAKEN: "Já tem alguém com esse nome na sala. Que tal um apelido?",
  SESSION_FINISHED: "Esse julgamento já acabou.",
  ALREADY_VOTED: "Você já votou nesse gato.",
  VOTING_CLOSED: "A votação desse gato já fechou.",
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return FRIENDLY[error.code] ?? error.message;
  return "Algo deu errado no tribunal. Tente de novo.";
}

export function errorCode(error: unknown) {
  return error instanceof ApiError ? error.code : "UNKNOWN";
}

// Mesmo critério da API: sem espaços nas pontas e em maiúsculas
export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}
