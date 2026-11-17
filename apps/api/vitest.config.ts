import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    // Os de integração precisam de banco: rodam em "pnpm test:integration"
    exclude: [...configDefaults.exclude, "src/**/*.integration.spec.ts"],
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
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
