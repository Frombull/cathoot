import { defineConfig } from "vitest/config";

// Precisa de um Postgres no DATABASE_URL (com as migrations aplicadas)
export default defineConfig({
  test: {
    include: ["src/**/*.integration.spec.ts"],
    // Os testes limpam a mesma tabela, então não podem rodar em paralelo
    fileParallelism: false,
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results/junit-integration.xml" },
  },
});
