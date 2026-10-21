import { beforeEach, describe, expect, it } from "vitest";
import type { CatalogCat } from "../catalog/catalog.js";
import { InMemorySessionRepository } from "./in-memory-session-repository.js";
import type { StoredSession } from "./session-repository.js";
import { SessionService } from "./session-service.js";

const catalog: CatalogCat[] = [
  { id: 1, name: "Bolinha", crime: "Bebeu água do esgoto", imageUrl: "/cats/1.jpg" },
  { id: 2, name: "Mingau", crime: "Roubou o peixe", imageUrl: "/cats/2.png" },
];

const erro = (code: string) => expect.objectContaining({ code });

let repo: InMemorySessionRepository;
let service: SessionService;

const novoServico = (random?: () => number) => new SessionService(repo, catalog, "miau", random);

beforeEach(() => {
  repo = new InMemorySessionRepository();
  service = novoServico();
});

describe("criar sala", () => {
  it("recusa senha errada", async () => {
    await expect(service.create("errada")).rejects.toMatchObject(erro("PRESENTER_UNAUTHORIZED"));
  });

  it("cria a sala no lobby com todos os gatos do catálogo", async () => {
    const { code, presenterToken } = await service.create("miau");

    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    expect(presenterToken).toBeTruthy();
    expect(await service.view(code)).toMatchObject({ code, state: "LOBBY", totalCats: 2, participants: [] });
  });

  it("não repete o código de uma sala que já existe, nem depois de reiniciar", async () => {
    const sempreIgual = () => 0;
    await novoServico(sempreIgual).create("miau");

    const reiniciado = novoServico(sempreIgual);
    await reiniciado.onModuleInit();

    await expect(reiniciado.create("miau")).rejects.toMatchObject(erro("ROOM_CODE_EXHAUSTED"));
  });
});

describe("ver a sala", () => {
  it("falha com sala que não existe", async () => {
    await expect(service.view("NADA22")).rejects.toMatchObject(erro("SESSION_NOT_FOUND"));
  });

  it("aceita o código em minúsculas e com espaços", async () => {
    const { code } = await service.create("miau");

    expect((await service.view(` ${code.toLowerCase()} `)).code).toBe(code);
  });

  it("no lobby ainda não mostra gato, resultado nem resumo", async () => {
    const { code } = await service.create("miau");

    expect(await service.view(code)).toMatchObject({ cat: null, catNumber: null, result: null, summary: null });
  });

  it("falha com participante que não existe", async () => {
    const { code } = await service.create("miau");

    await expect(service.view(code, "fantasma")).rejects.toMatchObject(erro("PARTICIPANT_NOT_FOUND"));
  });
});

describe("entrar na sala", () => {
  it("devolve o id do participante, que aparece no lobby", async () => {
    const { code } = await service.create("miau");

    const ana = await service.join(code, "  Ana ");

    expect(ana).toEqual({ participantId: expect.any(String), name: "Ana" });
    expect((await service.view(code)).participants).toEqual(["Ana"]);
  });

  it("recusa nome repetido", async () => {
    const { code } = await service.create("miau");
    await service.join(code, "Ana");

    await expect(service.join(code, "ana")).rejects.toMatchObject(erro("PARTICIPANT_NAME_TAKEN"));
  });

  it("falha com sala que não existe", async () => {
    await expect(service.join("NADA22", "Ana")).rejects.toMatchObject(erro("SESSION_NOT_FOUND"));
  });
});

describe("rodada", () => {
  let code: string;
  let token: string;
  let ana: string;

  beforeEach(async () => {
    ({ code, presenterToken: token } = await service.create("miau"));
    ana = (await service.join(code, "Ana")).participantId;
  });

  it("só o apresentador, com o token da sala, avança", async () => {
    await expect(service.start(code, "token-errado")).rejects.toMatchObject(erro("PRESENTER_UNAUTHORIZED"));
    await expect(service.start(code, undefined)).rejects.toMatchObject(erro("PRESENTER_UNAUTHORIZED"));
    expect((await service.view(code)).state).toBe("LOBBY");
  });

  it("o token de uma sala não vale em outra", async () => {
    const outra = await service.create("miau");

    await expect(service.start(code, outra.presenterToken)).rejects.toMatchObject(erro("PRESENTER_UNAUTHORIZED"));
  });

  it("mostra o primeiro gato ao começar, ainda sem placar", async () => {
    await service.start(code, token);

    const view = await service.view(code, ana);
    expect(view).toMatchObject({
      state: "VOTANDO",
      catNumber: 1,
      totalCats: 2,
      cat: { name: "Bolinha", crime: "Bebeu água do esgoto", imageUrl: "/cats/1.jpg" },
      votesReceived: 0,
      hasVoted: false,
      result: null,
    });
    expect(JSON.stringify(view)).not.toMatch(/guilty|innocent/);
  });

  it("registra o voto e conta sem revelar o lado", async () => {
    await service.start(code, token);

    await service.vote(code, ana, "CULPADO");

    const view = await service.view(code, ana);
    expect(view).toMatchObject({ votesReceived: 1, hasVoted: true });
    expect(JSON.stringify(view)).not.toMatch(/guilty|innocent/);
  });

  it("recusa voto repetido, escolha inválida e voto fora da votação", async () => {
    await expect(service.vote(code, ana, "CULPADO")).rejects.toMatchObject(erro("VOTING_CLOSED"));
    await service.start(code, token);
    await service.vote(code, ana, "CULPADO");

    await expect(service.vote(code, ana, "INOCENTE")).rejects.toMatchObject(erro("ALREADY_VOTED"));
    await expect(service.vote(code, ana, "TALVEZ")).rejects.toMatchObject(erro("VOTE_CHOICE_INVALID"));
    await expect(service.vote(code, "fantasma", "CULPADO")).rejects.toMatchObject(erro("PARTICIPANT_NOT_FOUND"));
  });

  it("revela o placar e o veredito", async () => {
    await service.start(code, token);
    await service.vote(code, ana, "CULPADO");

    await service.reveal(code, token);

    expect(await service.view(code)).toMatchObject({
      state: "RESULTADO",
      cat: { name: "Bolinha" },
      result: { guilty: 1, innocent: 0, verdict: "CULPADO" },
    });
  });

  it("vai até o fim e mostra a Prisão da Soneca", async () => {
    await service.start(code, token);
    await service.vote(code, ana, "CULPADO");
    await service.reveal(code, token);
    await service.next(code, token);
    await service.vote(code, ana, "INOCENTE");
    await service.reveal(code, token);
    await service.next(code, token);

    const view = await service.view(code);
    expect(view).toMatchObject({ state: "FIM", cat: null, catNumber: null });
    expect(view.summary?.prison.map((c) => c.name)).toEqual(["Bolinha"]);
    expect(view.summary?.mostGuilty).toMatchObject({ cat: { name: "Bolinha" }, guilty: 1, innocent: 0 });
  });

  it("transição inválida vira erro de domínio", async () => {
    await expect(service.reveal(code, token)).rejects.toMatchObject(erro("INVALID_STATE_TRANSITION"));
  });
});

// Demora mais para gravar a sala com um participante só, como um banco lento numa gravação antiga
class LentoNaPrimeiraEntrada extends InMemorySessionRepository {
  override async save(stored: StoredSession) {
    if (stored.snapshot.participants.length === 1) await new Promise((resolve) => setTimeout(resolve, 20));
    await super.save(stored);
  }
}

describe("persistência", () => {
  it("uma gravação antiga e lenta nunca sobrescreve uma mais nova", async () => {
    repo = new LentoNaPrimeiraEntrada();
    service = novoServico();
    const { code } = await service.create("miau");

    await Promise.all([service.join(code, "Ana"), service.join(code, "Beto")]);

    expect((await novoServico().view(code)).participants).toEqual(["Ana", "Beto"]);
  });

  it("continua de onde parou depois de reiniciar a API", async () => {
    const { code, presenterToken } = await service.create("miau");
    const ana = (await service.join(code, "Ana")).participantId;
    await service.start(code, presenterToken);
    await service.vote(code, ana, "CULPADO");

    const reiniciado = novoServico();

    expect(await reiniciado.view(code, ana)).toMatchObject({ state: "VOTANDO", votesReceived: 1, hasVoted: true });
    await expect(reiniciado.vote(code, ana, "INOCENTE")).rejects.toMatchObject(erro("ALREADY_VOTED"));
    await expect(reiniciado.reveal(code, "token-errado")).rejects.toMatchObject(erro("PRESENTER_UNAUTHORIZED"));
    await reiniciado.reveal(code, presenterToken);
  });

  it("não perde votos quando a turma toda vota ao mesmo tempo, mesmo com a API recém-reiniciada", async () => {
    const { code, presenterToken } = await service.create("miau");
    const ids = await Promise.all(Array.from({ length: 40 }, (_, i) => service.join(code, `Aluno ${i}`)));
    await service.start(code, presenterToken);

    const reiniciado = novoServico();
    await Promise.all(ids.map(({ participantId }, i) => reiniciado.vote(code, participantId, i < 25 ? "CULPADO" : "INOCENTE")));
    await reiniciado.reveal(code, presenterToken);

    expect((await novoServico().view(code)).result).toMatchObject({ guilty: 25, innocent: 15, verdict: "CULPADO" });
  });
});
