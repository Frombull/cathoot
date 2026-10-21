import { beforeEach, describe, expect, it } from "vitest";
import { Session } from "./session.js";

const gato = (name: string) => ({
  name,
  imageUrl: `https://exemplo.com/${name}.png`,
  crime: `Crime do ${name}`,
});

const erro = (code: string) => expect.objectContaining({ code });

let session: Session;

beforeEach(() => {
  session = new Session("ABC234");
});

describe("lobby", () => {
  it("começa em LOBBY, sem gatos nem participantes", () => {
    expect(session.state).toBe("LOBBY");
    expect(session.code).toBe("ABC234");
    expect(session.cats).toEqual([]);
    expect(session.participants).toEqual([]);
    expect(session.currentCat).toBeUndefined();
  });

  it("cadastra gatos", () => {
    session.addCat(gato("Bolinha"));
    session.addCat(gato("Mingau"));

    expect(session.cats.map((c) => c.name)).toEqual(["Bolinha", "Mingau"]);
  });

  it("recusa gato inválido", () => {
    expect(() => session.addCat({ ...gato("Bolinha"), crime: "" })).toThrowError(erro("CAT_CRIME_REQUIRED"));
    expect(session.cats).toEqual([]);
  });

  it("não cadastra gato depois que o jogo começou", () => {
    session.addCat(gato("Bolinha"));
    session.start();

    expect(() => session.addCat(gato("Mingau"))).toThrowError(erro("SESSION_NOT_IN_LOBBY"));
  });
});

describe("participantes", () => {
  it("entram só com o nome", () => {
    const ana = session.join("Ana");

    expect(ana.name).toBe("Ana");
    expect(ana.id).toBeTruthy();
    expect(session.participants).toEqual([ana]);
  });

  it("recusam nome vazio", () => {
    expect(() => session.join("   ")).toThrowError(erro("PARTICIPANT_NAME_REQUIRED"));
  });

  it("recusam nome repetido, sem diferenciar maiúsculas nem espaços nas pontas", () => {
    session.join("Ana");

    expect(() => session.join(" ana ")).toThrowError(erro("PARTICIPANT_NAME_TAKEN"));
    expect(session.participants).toHaveLength(1);
  });

  it("podem entrar com o jogo em andamento", () => {
    session.addCat(gato("Bolinha"));
    session.start();

    expect(session.join("Ana").name).toBe("Ana");
  });

  it("não entram depois do fim", () => {
    session.addCat(gato("Bolinha"));
    session.start();
    session.reveal();
    session.next();

    expect(() => session.join("Ana")).toThrowError(erro("SESSION_FINISHED"));
  });
});

describe("start", () => {
  it("exige ao menos um gato", () => {
    expect(() => session.start()).toThrowError(erro("SESSION_HAS_NO_CATS"));
    expect(session.state).toBe("LOBBY");
  });

  it("vai para VOTANDO com o primeiro gato em julgamento", () => {
    session.addCat(gato("Bolinha"));
    session.addCat(gato("Mingau"));

    session.start();

    expect(session.state).toBe("VOTANDO");
    expect(session.currentCat?.name).toBe("Bolinha");
  });

  it("só vale uma vez", () => {
    session.addCat(gato("Bolinha"));
    session.start();

    expect(() => session.start()).toThrowError(erro("INVALID_STATE_TRANSITION"));
  });
});

describe("votos", () => {
  beforeEach(() => {
    session.addCat(gato("Bolinha"));
    session.addCat(gato("Mingau"));
  });

  it("só se vota em VOTANDO", () => {
    const ana = session.join("Ana");

    expect(() => session.vote(ana.id, "CULPADO")).toThrowError(erro("VOTING_CLOSED"));
  });

  it("não se vota depois de revelar", () => {
    const ana = session.join("Ana");
    session.start();
    session.reveal();

    expect(() => session.vote(ana.id, "CULPADO")).toThrowError(erro("VOTING_CLOSED"));
  });

  it("recusa participante desconhecido", () => {
    session.start();

    expect(() => session.vote("fantasma", "CULPADO")).toThrowError(erro("PARTICIPANT_NOT_FOUND"));
  });

  it("o voto é único: votar de novo falha, mesmo trocando de lado", () => {
    const ana = session.join("Ana");
    session.start();
    session.vote(ana.id, "CULPADO");

    expect(() => session.vote(ana.id, "INOCENTE")).toThrowError(erro("ALREADY_VOTED"));
    expect(() => session.vote(ana.id, "CULPADO")).toThrowError(erro("ALREADY_VOTED"));
    expect(session.reveal()).toMatchObject({ guilty: 1, innocent: 0 });
  });

  it("o mesmo participante vota de novo no gato seguinte", () => {
    const ana = session.join("Ana");
    session.start();
    session.vote(ana.id, "CULPADO");
    session.reveal();
    session.next();

    expect(() => session.vote(ana.id, "INOCENTE")).not.toThrow();
  });
});

describe("acompanhamento da votação", () => {
  beforeEach(() => {
    session.addCat(gato("Bolinha"));
    session.addCat(gato("Mingau"));
  });

  it("numera o gato atual a partir de 1", () => {
    const ana = session.join("Ana");
    expect(session.currentCatNumber).toBeUndefined();

    session.start();
    expect(session.currentCatNumber).toBe(1);

    session.vote(ana.id, "CULPADO");
    session.reveal();
    session.next();
    expect(session.currentCatNumber).toBe(2);

    session.reveal();
    session.next();
    expect(session.currentCatNumber).toBeUndefined();
  });

  it("conta os votos recebidos no gato atual sem revelar o lado", () => {
    const ana = session.join("Ana");
    session.join("Beto");
    session.start();
    expect(session.votesReceived).toBe(0);

    session.vote(ana.id, "CULPADO");

    expect(session.votesReceived).toBe(1);
  });

  it("diz se um participante já votou no gato atual", () => {
    const ana = session.join("Ana");
    const beto = session.join("Beto");
    session.start();
    session.vote(ana.id, "CULPADO");

    expect(session.hasVoted(ana.id)).toBe(true);
    expect(session.hasVoted(beto.id)).toBe(false);
    expect(session.hasVoted("fantasma")).toBe(false);
  });

  it("zera a contagem ao passar para o gato seguinte", () => {
    const ana = session.join("Ana");
    session.start();
    session.vote(ana.id, "CULPADO");
    session.reveal();
    session.next();

    expect(session.votesReceived).toBe(0);
    expect(session.hasVoted(ana.id)).toBe(false);
  });

  it("expõe o resultado do gato só enquanto está em RESULTADO", () => {
    const ana = session.join("Ana");
    session.start();
    session.vote(ana.id, "CULPADO");
    expect(session.currentResult).toBeUndefined();

    session.reveal();
    expect(session.currentResult).toMatchObject({ cat: { name: "Bolinha" }, guilty: 1, innocent: 0, verdict: "CULPADO" });

    session.next();
    expect(session.currentResult).toBeUndefined();
  });
});

describe("revelar", () => {
  beforeEach(() => {
    session.addCat(gato("Bolinha"));
  });

  it("só depois de começar", () => {
    expect(() => session.reveal()).toThrowError(erro("INVALID_STATE_TRANSITION"));
  });

  it("vai para RESULTADO com o placar e o veredito", () => {
    const [ana, bia, caio] = ["Ana", "Bia", "Caio"].map((n) => session.join(n));
    session.start();
    session.vote(ana.id, "CULPADO");
    session.vote(bia.id, "CULPADO");
    session.vote(caio.id, "INOCENTE");

    const result = session.reveal();

    expect(session.state).toBe("RESULTADO");
    expect(result).toEqual({ cat: gato("Bolinha"), guilty: 2, innocent: 1, verdict: "CULPADO" });
  });

  it("absolve no empate", () => {
    const [ana, bia] = ["Ana", "Bia"].map((n) => session.join(n));
    session.start();
    session.vote(ana.id, "CULPADO");
    session.vote(bia.id, "INOCENTE");

    expect(session.reveal().verdict).toBe("INOCENTE");
  });

  it("não revela duas vezes", () => {
    session.start();
    session.reveal();

    expect(() => session.reveal()).toThrowError(erro("INVALID_STATE_TRANSITION"));
  });
});

describe("próximo", () => {
  beforeEach(() => {
    session.addCat(gato("Bolinha"));
    session.addCat(gato("Mingau"));
  });

  it("só depois de revelar", () => {
    session.start();

    expect(() => session.next()).toThrowError(erro("INVALID_STATE_TRANSITION"));
  });

  it("volta a VOTANDO com o gato seguinte", () => {
    session.start();
    session.reveal();

    session.next();

    expect(session.state).toBe("VOTANDO");
    expect(session.currentCat?.name).toBe("Mingau");
  });

  it("termina em FIM depois do último gato", () => {
    session.start();
    session.reveal();
    session.next();
    session.reveal();

    session.next();

    expect(session.state).toBe("FIM");
    expect(session.currentCat).toBeUndefined();
  });

  it("nada avança depois do fim", () => {
    session.start();
    session.reveal();
    session.next();
    session.reveal();
    session.next();

    expect(() => session.next()).toThrowError(erro("INVALID_STATE_TRANSITION"));
    expect(() => session.reveal()).toThrowError(erro("INVALID_STATE_TRANSITION"));
  });
});

describe("resumo final", () => {
  function jogar(votosPorGato: Array<[culpados: number, inocentes: number]>) {
    votosPorGato.forEach((_, i) => session.addCat(gato(`Gato${i}`)));
    const total = Math.max(...votosPorGato.map(([c, i]) => c + i));
    const pessoas = Array.from({ length: total }, (_, i) => session.join(`Aluno${i}`));
    session.start();
    for (const [culpados, inocentes] of votosPorGato) {
      pessoas.forEach((p, i) => {
        if (i < culpados) session.vote(p.id, "CULPADO");
        else if (i < culpados + inocentes) session.vote(p.id, "INOCENTE");
      });
      session.reveal();
      session.next();
    }
  }

  it("só existe no FIM", () => {
    session.addCat(gato("Bolinha"));
    session.start();

    expect(() => session.summary()).toThrowError(erro("SESSION_NOT_FINISHED"));
  });

  it("manda os condenados para a Prisão da Soneca, na ordem do julgamento", () => {
    jogar([[3, 1], [1, 3], [2, 1]]);

    expect(session.summary().prison.map((c) => c.name)).toEqual(["Gato0", "Gato2"]);
  });

  it("aponta o gato mais culpado", () => {
    jogar([[2, 1], [4, 0], [3, 1]]);

    expect(session.summary().mostGuilty?.cat.name).toBe("Gato1");
  });

  it("no empate de culpados, vale o primeiro gato julgado", () => {
    jogar([[3, 0], [3, 0]]);

    expect(session.summary().mostGuilty?.cat.name).toBe("Gato0");
  });

  it("não há gato mais culpado quando ninguém votou culpado", () => {
    jogar([[0, 2], [0, 1]]);

    const resumo = session.summary();

    expect(resumo.mostGuilty).toBeNull();
    expect(resumo.prison).toEqual([]);
  });
});
