import { randomUUID } from "node:crypto";
import { createCat, type Cat } from "./cat.js";
import { DomainError } from "./errors.js";
import { computeVerdict, tally, type Tally, type Verdict, type VoteChoice } from "./verdict.js";

export type SessionState = "LOBBY" | "VOTANDO" | "RESULTADO" | "FIM";

export interface Participant {
  id: string;
  name: string;
}

export interface CatResult extends Tally {
  cat: Cat;
  verdict: Verdict;
}

export interface Summary {
  prison: Cat[];
  mostGuilty: CatResult | null;
}

// Tudo que a sessão precisa para continuar de onde parou; é só JSON, então cabe numa coluna do banco
export interface SessionSnapshot {
  code: string;
  state: SessionState;
  cats: Cat[];
  participants: Participant[];
  currentIndex: number;
  currentVotes: Record<string, VoteChoice>;
  results: CatResult[];
}

const NO_CAT = -1;

// Regras da sessão. Não conhece HTTP nem banco; quem chama garante que só o apresentador
// usa addCat/start/reveal/next.
export class Session {
  private _state: SessionState = "LOBBY";
  private _cats: Cat[] = [];
  private _participants: Participant[] = [];
  private currentIndex = NO_CAT;
  private currentVotes = new Map<string, VoteChoice>();
  private results: CatResult[] = [];

  constructor(readonly code: string) {}

  static restore(snapshot: SessionSnapshot) {
    const copy = structuredClone(snapshot);
    const session = new Session(copy.code);
    session._state = copy.state;
    session._cats = copy.cats;
    session._participants = copy.participants;
    session.currentIndex = copy.currentIndex;
    session.currentVotes = new Map(Object.entries(copy.currentVotes));
    session.results = copy.results;
    return session;
  }

  toSnapshot(): SessionSnapshot {
    return structuredClone({
      code: this.code,
      state: this._state,
      cats: this._cats,
      participants: this._participants,
      currentIndex: this.currentIndex,
      currentVotes: Object.fromEntries(this.currentVotes),
      results: this.results,
    });
  }

  get state() {
    return this._state;
  }

  get cats(): readonly Cat[] {
    return this._cats;
  }

  get participants(): readonly Participant[] {
    return this._participants;
  }

  get currentCat(): Cat | undefined {
    return this._cats[this.currentIndex];
  }

  get currentCatNumber() {
    return this.currentIndex === NO_CAT ? undefined : this.currentIndex + 1;
  }

  get votesReceived() {
    return this.currentVotes.size;
  }

  get currentResult(): CatResult | undefined {
    return this._state === "RESULTADO" ? this.results.at(-1) : undefined;
  }

  hasVoted(participantId: string) {
    return this.currentVotes.has(participantId);
  }

  addCat(input: Cat) {
    if (this._state !== "LOBBY") {
      throw new DomainError("SESSION_NOT_IN_LOBBY", "Gatos só podem ser cadastrados no lobby");
    }
    const cat = createCat(input);
    this._cats.push(cat);
    return cat;
  }

  join(rawName: string) {
    if (this._state === "FIM") {
      throw new DomainError("SESSION_FINISHED", "A sessão já terminou");
    }
    const name = rawName.trim();
    if (!name) throw new DomainError("PARTICIPANT_NAME_REQUIRED", "Digite um nome");
    if (this._participants.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      throw new DomainError("PARTICIPANT_NAME_TAKEN", "Já tem alguém com esse nome na sala");
    }
    const participant = { id: randomUUID(), name };
    this._participants.push(participant);
    return participant;
  }

  start() {
    this.expectState("LOBBY");
    if (this._cats.length === 0) {
      throw new DomainError("SESSION_HAS_NO_CATS", "Cadastre ao menos um gato antes de começar");
    }
    this.currentIndex = 0;
    this._state = "VOTANDO";
  }

  vote(participantId: string, choice: VoteChoice) {
    if (this._state !== "VOTANDO") {
      throw new DomainError("VOTING_CLOSED", "A votação não está aberta");
    }
    if (!this._participants.some((p) => p.id === participantId)) {
      throw new DomainError("PARTICIPANT_NOT_FOUND", "Participante não está na sala");
    }
    if (this.currentVotes.has(participantId)) {
      throw new DomainError("ALREADY_VOTED", "Cada participante vota uma vez por gato");
    }
    this.currentVotes.set(participantId, choice);
  }

  reveal() {
    this.expectState("VOTANDO");
    const counts = tally([...this.currentVotes.values()]);
    const result: CatResult = { cat: this._cats[this.currentIndex], ...counts, verdict: computeVerdict(counts) };
    this.results.push(result);
    this._state = "RESULTADO";
    return result;
  }

  next() {
    this.expectState("RESULTADO");
    this.currentVotes = new Map();
    if (this.currentIndex + 1 < this._cats.length) {
      this.currentIndex += 1;
      this._state = "VOTANDO";
    } else {
      this.currentIndex = NO_CAT;
      this._state = "FIM";
    }
  }

  summary(): Summary {
    if (this._state !== "FIM") {
      throw new DomainError("SESSION_NOT_FINISHED", "O resumo só existe depois do último gato");
    }
    const prison = this.results.filter((r) => r.verdict === "CULPADO").map((r) => r.cat);
    // Em empate de culpados, vale o primeiro gato julgado
    const top = this.results.reduce<CatResult | null>((best, r) => (r.guilty > (best?.guilty ?? 0) ? r : best), null);
    return { prison, mostGuilty: top };
  }

  private expectState(expected: SessionState) {
    if (this._state !== expected) {
      throw new DomainError("INVALID_STATE_TRANSITION", `Ação inválida no estado ${this._state}`);
    }
  }
}
