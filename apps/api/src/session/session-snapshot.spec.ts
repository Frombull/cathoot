import { describe, expect, it } from "vitest";
import { Session } from "./session.js";

const gato = (name: string) => ({
  name,
  imageUrl: `https://exemplo.com/${name}.png`,
  crime: `Crime do ${name}`,
});

const erro = (code: string) => expect.objectContaining({ code });

// Sessão no meio do jogo: Bolinha já julgado e condenado, Mingau em votação com um voto
function sessaoNoMeioDoJogo() {
  const session = new Session("ABC234");
  session.addCat(gato("Bolinha"));
  session.addCat(gato("Mingau"));
  const ana = session.join("Ana");
  const beto = session.join("Beto");
  session.start();
  session.vote(ana.id, "CULPADO");
  session.vote(beto.id, "CULPADO");
  session.reveal();
  session.next();
  session.vote(ana.id, "INOCENTE");
  return { session, ana, beto };
}

describe("snapshot", () => {
  it("restaura a sessão no mesmo estado", () => {
    const { session } = sessaoNoMeioDoJogo();

    const restored = Session.restore(session.toSnapshot());

    expect(restored.code).toBe("ABC234");
    expect(restored.state).toBe("VOTANDO");
    expect(restored.currentCat?.name).toBe("Mingau");
    expect(restored.cats.map((c) => c.name)).toEqual(["Bolinha", "Mingau"]);
    expect(restored.participants.map((p) => p.name)).toEqual(["Ana", "Beto"]);
  });

  it("sobrevive a um ciclo de JSON, como no banco", () => {
    const { session } = sessaoNoMeioDoJogo();

    const restored = Session.restore(JSON.parse(JSON.stringify(session.toSnapshot())));

    expect(restored.state).toBe("VOTANDO");
    expect(restored.currentCat?.name).toBe("Mingau");
  });

  it("lembra quem já votou no gato atual", () => {
    const { session, ana } = sessaoNoMeioDoJogo();

    const restored = Session.restore(session.toSnapshot());

    expect(() => restored.vote(ana.id, "CULPADO")).toThrowError(erro("ALREADY_VOTED"));
  });

  it("segue o jogo até o resumo, guardando os veredictos anteriores", () => {
    const { session, beto } = sessaoNoMeioDoJogo();
    const restored = Session.restore(session.toSnapshot());

    restored.vote(beto.id, "INOCENTE");
    restored.reveal();
    restored.next();

    expect(restored.state).toBe("FIM");
    const { prison, mostGuilty } = restored.summary();
    expect(prison.map((c) => c.name)).toEqual(["Bolinha"]);
    expect(mostGuilty?.cat.name).toBe("Bolinha");
  });

  it("não é afetado por mudanças feitas depois no snapshot nem na sessão", () => {
    const { session, ana } = sessaoNoMeioDoJogo();
    const snapshot = session.toSnapshot();

    snapshot.cats.push(gato("Intruso"));
    snapshot.currentVotes[ana.id] = "CULPADO";
    const restored = Session.restore(session.toSnapshot());
    restored.reveal();

    expect(session.cats.map((c) => c.name)).toEqual(["Bolinha", "Mingau"]);
    expect(session.state).toBe("VOTANDO");
  });

  it("restaura uma sessão nova, ainda no lobby", () => {
    const restored = Session.restore(new Session("ZZZ999").toSnapshot());

    expect(restored.state).toBe("LOBBY");
    expect(restored.currentCat).toBeUndefined();
    expect(() => restored.start()).toThrowError(erro("SESSION_HAS_NO_CATS"));
  });
});
