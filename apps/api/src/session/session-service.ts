import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { CatalogCat } from "../catalog/catalog.js";
import type { Cat } from "./cat.js";
import { DomainError } from "./errors.js";
import { generateRoomCode, normalizeRoomCode } from "./room-code.js";
import { Session, type CatResult, type SessionState } from "./session.js";
import { SessionRepository } from "./session-repository.js";
import type { VoteChoice } from "./verdict.js";

export interface SessionView {
  code: string;
  state: SessionState;
  participants: string[];
  totalCats: number;
  catNumber: number | null;
  cat: Cat | null;
  votesReceived: number;
  // Só vem quando a requisição informa quem é o participante
  hasVoted?: boolean;
  // O placar só existe depois do "Revelar"
  result: { guilty: number; innocent: number; verdict: VoteChoice } | null;
  summary: { prison: Cat[]; mostGuilty: CatResult | null } | null;
}

interface Entry {
  session: Session;
  presenterToken: string;
  // Gravações em fila, para uma gravação antiga nunca sobrescrever uma mais nova
  saving: Promise<void>;
}

const CHOICES: readonly string[] = ["CULPADO", "INOCENTE"];

// Compara por hash, em tempo constante
function sameSecret(given: string | undefined, expected: string) {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return given !== undefined && timingSafeEqual(hash(given), hash(expected));
}

const unauthorized = () => new DomainError("PRESENTER_UNAUTHORIZED", "Senha ou token do apresentador inválido");

// Orquestra as salas: cada sala vive em memória (uma só instância da API) e é gravada no repositório a
// cada ação, para sobreviver a um reinício. Se a gravação falhar, a ação já valeu na memória e o erro sobe.
export class SessionService {
  private readonly entries = new Map<string, Promise<Entry>>();
  private readonly takenCodes = new Set<string>();

  constructor(
    private readonly repo: SessionRepository,
    private readonly catalog: readonly CatalogCat[],
    private readonly presenterPassword: string,
    private readonly random: () => number = Math.random,
  ) {}

  async onModuleInit() {
    for (const code of await this.repo.codes()) this.takenCodes.add(code);
  }

  async create(password: string) {
    if (!sameSecret(password, this.presenterPassword)) throw unauthorized();

    const code = generateRoomCode((candidate) => this.takenCodes.has(candidate), this.random);
    this.takenCodes.add(code);
    const session = new Session(code);
    for (const { name, imageUrl, crime } of this.catalog) session.addCat({ name, imageUrl, crime });
    const entry: Entry = { session, presenterToken: randomBytes(16).toString("hex"), saving: Promise.resolve() };
    this.entries.set(code, Promise.resolve(entry));

    try {
      await this.persist(entry);
    } catch (error) {
      this.entries.delete(code);
      this.takenCodes.delete(code);
      throw error;
    }
    return { code, presenterToken: entry.presenterToken };
  }

  async view(code: string, participantId?: string): Promise<SessionView> {
    const { session } = await this.load(code);
    if (participantId !== undefined && !session.participants.some((p) => p.id === participantId)) {
      throw new DomainError("PARTICIPANT_NOT_FOUND", "Participante não está na sala");
    }
    const result = session.currentResult;
    return {
      code: session.code,
      state: session.state,
      participants: session.participants.map((p) => p.name),
      totalCats: session.cats.length,
      catNumber: session.currentCatNumber ?? null,
      cat: session.currentCat ?? null,
      votesReceived: session.votesReceived,
      hasVoted: participantId === undefined ? undefined : session.hasVoted(participantId),
      result: result ? { guilty: result.guilty, innocent: result.innocent, verdict: result.verdict } : null,
      summary: session.state === "FIM" ? session.summary() : null,
    };
  }

  async join(code: string, name: string) {
    const entry = await this.load(code);
    const participant = entry.session.join(name);
    await this.persist(entry);
    return { participantId: participant.id, name: participant.name };
  }

  async vote(code: string, participantId: string, choice: string) {
    if (!CHOICES.includes(choice)) {
      throw new DomainError("VOTE_CHOICE_INVALID", "O voto precisa ser CULPADO ou INOCENTE");
    }
    const entry = await this.load(code);
    entry.session.vote(participantId, choice as VoteChoice);
    await this.persist(entry);
  }

  start(code: string, token: string | undefined) {
    return this.presenterAction(code, token, (session) => session.start());
  }

  reveal(code: string, token: string | undefined) {
    return this.presenterAction(code, token, (session) => session.reveal());
  }

  next(code: string, token: string | undefined) {
    return this.presenterAction(code, token, (session) => session.next());
  }

  private async presenterAction(code: string, token: string | undefined, action: (session: Session) => unknown) {
    const entry = await this.load(code);
    if (!sameSecret(token, entry.presenterToken)) throw unauthorized();
    action(entry.session);
    await this.persist(entry);
  }

  // O cache guarda a Promise: carregamentos simultâneos da mesma sala a frio dividem o mesmo objeto
  private async load(rawCode: string) {
    const code = normalizeRoomCode(rawCode);
    let pending = this.entries.get(code);
    if (!pending) {
      pending = this.fetch(code);
      this.entries.set(code, pending);
    }
    try {
      return await pending;
    } catch (error) {
      this.entries.delete(code);
      throw error;
    }
  }

  private async fetch(code: string): Promise<Entry> {
    const stored = await this.repo.find(code);
    if (!stored) throw new DomainError("SESSION_NOT_FOUND", "Sala não encontrada");
    return { session: Session.restore(stored.snapshot), presenterToken: stored.presenterToken, saving: Promise.resolve() };
  }

  private persist(entry: Entry) {
    const stored = { presenterToken: entry.presenterToken, snapshot: entry.session.toSnapshot() };
    const run = entry.saving.then(() => this.repo.save(stored));
    entry.saving = run.catch(() => undefined);
    return run;
  }
}
