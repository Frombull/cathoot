import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    // Os de integração precisam de banco: rodam em "pnpm test:integration"
    exclude: [...configDefaults.exclude, "src/**/*.integration.spec.ts"],
    // JUnit para o Jenkins publicar o relatório; no terminal, saída normal
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results/junit.xml" },
    // Só com "pnpm test:coverage" (o Jenkins usa esse). Abaixo de 90% o comando falha
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.spec.ts",
        // Testes compartilhados entre o repositório em memória e o do Prisma
        "src/**/*.contract.ts",
        // Gerado pelo "prisma generate"
        "src/generated/**",
        // Só sobe o Nest (3 linhas); o AppModule é testado em http/api.spec.ts
        "src/main.ts",
        // Precisam do Postgres: a cobertura deles vem do vitest.integration.config.ts
        "src/prisma/**",
        "src/session/prisma-session-repository.ts",
      ],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
