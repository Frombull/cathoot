import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { CatsController } from "./catalog/cats.controller.js";
import { CATALOG, CATALOG_DIR } from "./catalog/catalog.tokens.js";
import { DEFAULT_CATALOG_DIR, loadCatalog } from "./catalog/catalog.js";
import { HealthController } from "./health/health.controller.js";
import { DomainErrorFilter } from "./http/domain-error.filter.js";
import { PrismaService } from "./prisma/prisma.service.js";
import { PrismaSessionRepository } from "./session/prisma-session-repository.js";
import { SessionController } from "./session/session.controller.js";
import { SessionRepository } from "./session/session-repository.js";
import { SessionService } from "./session/session-service.js";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} é obrigatória`);
  return value;
}

@Module({
  controllers: [HealthController, SessionController, CatsController],
  providers: [
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: CATALOG_DIR, useValue: DEFAULT_CATALOG_DIR },
    // Lê e valida o catálogo ao subir: um gato quebrado impede a API de iniciar
    { provide: CATALOG, useFactory: (dir: string) => loadCatalog(dir), inject: [CATALOG_DIR] },
    { provide: PrismaService, useFactory: () => new PrismaService(requiredEnv("DATABASE_URL")) },
    { provide: SessionRepository, useFactory: (prisma: PrismaService) => new PrismaSessionRepository(prisma), inject: [PrismaService] },
    {
      provide: SessionService,
      useFactory: (repo: SessionRepository, catalog: Awaited<ReturnType<typeof loadCatalog>>) =>
        new SessionService(repo, catalog, requiredEnv("PRESENTER_PASSWORD")),
      inject: [SessionRepository, CATALOG],
    },
  ],
})
export class AppModule {}
