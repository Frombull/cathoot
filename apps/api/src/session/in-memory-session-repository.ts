import { SessionRepository, type StoredSession } from "./session-repository.js";

// Copia ao guardar e ao devolver, como um banco de verdade faria
export class InMemorySessionRepository extends SessionRepository {
  private readonly sessions = new Map<string, StoredSession>();

  async find(code: string) {
    const stored = this.sessions.get(code);
    return stored && structuredClone(stored);
  }

  async save(stored: StoredSession) {
    this.sessions.set(stored.snapshot.code, structuredClone(stored));
  }

  async codes() {
    return [...this.sessions.keys()];
  }
}
