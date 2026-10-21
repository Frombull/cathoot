import { beforeEach, describe, expect, it } from "vitest";
import { Session } from "./session.js";
import type { SessionRepository } from "./session-repository.js";

const gato = { name: "Bolinha", imageUrl: "/cats/1.jpg", crime: "Bebeu água do esgoto" };

// Mesmos testes para qualquer implementação: a em memória (unitário) e a do Prisma (integração)
export function describeSessionRepository(name: string, create: () => Promise<SessionRepository>) {
  describe(`repositório de sessões (${name})`, () => {
    let repo: SessionRepository;

    beforeEach(async () => {
      repo = await create();
    });

    it("não acha uma sala que não existe", async () => {
      expect(await repo.find("NADA22")).toBeUndefined();
    });

    it("guarda e devolve o token e a sessão", async () => {
      const session = new Session("ABC234");
      session.addCat(gato);
      const ana = session.join("Ana");

      await repo.save({ presenterToken: "token-1", snapshot: session.toSnapshot() });
      const found = await repo.find("ABC234");

      expect(found?.presenterToken).toBe("token-1");
      const restored = Session.restore(found!.snapshot);
      expect(restored.cats.map((c) => c.name)).toEqual(["Bolinha"]);
      expect(restored.participants).toEqual([ana]);
    });

    it("salvar de novo atualiza a mesma sala", async () => {
      const session = new Session("ABC234");
      session.addCat(gato);
      await repo.save({ presenterToken: "token-1", snapshot: session.toSnapshot() });

      session.start();
      await repo.save({ presenterToken: "token-1", snapshot: session.toSnapshot() });

      const found = await repo.find("ABC234");
      expect(Session.restore(found!.snapshot).state).toBe("VOTANDO");
      expect(await repo.codes()).toEqual(["ABC234"]);
    });

    it("lista os códigos das salas", async () => {
      await repo.save({ presenterToken: "a", snapshot: new Session("AAA222").toSnapshot() });
      await repo.save({ presenterToken: "b", snapshot: new Session("BBB333").toSnapshot() });

      expect((await repo.codes()).sort()).toEqual(["AAA222", "BBB333"]);
    });
  });
}
