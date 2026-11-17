import { defineConfig } from "vitest/config";

// Precisa de um Postgres no DATABASE_URL (com as migrations aplicadas)
export default defineConfig({
  test: {
    include: ["src/**/*.integration.spec.ts"],
    // Os testes limpam a mesma tabela, então não podem rodar em paralelo
    fileParallelism: false,
    // A parte que os unitários deixam de fora (vitest.config.ts): o acesso ao Postgres
    coverage: {
      provider: "v8",
      include: ["src/prisma/**", "src/session/prisma-session-repository.ts"],
      reporter: ["text", "html"],
      reportsDirectory: "./coverage-integration",
    },
  },
});
