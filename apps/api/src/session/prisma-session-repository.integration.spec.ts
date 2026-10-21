import { afterAll } from "vitest";
import { PrismaService } from "../prisma/prisma.service.js";
import { PrismaSessionRepository } from "./prisma-session-repository.js";
import { describeSessionRepository } from "./session-repository.contract.js";

const prisma = new PrismaService(process.env.DATABASE_URL!);

afterAll(() => prisma.$disconnect());

describeSessionRepository("Postgres", async () => {
  await prisma.session.deleteMany();
  return new PrismaSessionRepository(prisma);
});
