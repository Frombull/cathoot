import { defineConfig } from "vitest/config";

// Precisa de um Postgres no DATABASE_URL (com as migrations aplicadas)
export default defineConfig({
  test: {
    include: ["src/**/*.integration.spec.ts"],
    // Os testes limpam a mesma tabela, então não podem rodar em paralelo
    fileParallelism: false,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results/junit-integration.xml" },
    // A parte que os unitários deixam de fora (vitest.config.ts): o acesso ao Postgres
    coverage: {
      provider: "v8",
      include: ["src/prisma/**", "src/session/prisma-session-repository.ts"],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage-integration",
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
