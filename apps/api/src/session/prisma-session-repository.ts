import type { PrismaService } from "../prisma/prisma.service.js";
import type { SessionSnapshot } from "./session.js";
import { SessionRepository, type StoredSession } from "./session-repository.js";

export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async find(code: string): Promise<StoredSession | undefined> {
    const row = await this.prisma.session.findUnique({ where: { code } });
    if (!row) return undefined;
    return { presenterToken: row.presenterToken, snapshot: row.snapshot as unknown as SessionSnapshot };
  }

  async save({ presenterToken, snapshot }: StoredSession) {
    const data = { presenterToken, snapshot: snapshot as unknown as object };
    await this.prisma.session.upsert({
      where: { code: snapshot.code },
      create: { code: snapshot.code, ...data },
      update: data,
    });
  }

  async codes() {
    const rows = await this.prisma.session.findMany({ select: { code: true } });
    return rows.map((r) => r.code);
  }
}
