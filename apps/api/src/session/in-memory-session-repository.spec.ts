import { describeSessionRepository } from "./session-repository.contract.js";
import { InMemorySessionRepository } from "./in-memory-session-repository.js";

describeSessionRepository("em memória", async () => new InMemorySessionRepository());
