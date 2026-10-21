import type { SessionSnapshot } from "./session.js";

export interface StoredSession {
  presenterToken: string;
  snapshot: SessionSnapshot;
}

// Classe abstrata para servir de token de injeção do Nest
export abstract class SessionRepository {
  abstract find(code: string): Promise<StoredSession | undefined>;
  // Cria a sala ou atualiza a que já existe (o código vem do snapshot)
  abstract save(stored: StoredSession): Promise<void>;
  abstract codes(): Promise<string[]>;
}
