import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    // Os de integração precisam de banco: rodam em "pnpm test:integration"
    exclude: [...configDefaults.exclude, "src/**/*.integration.spec.ts"],
    // JUnit para o Jenkins publicar o relatório; no terminal, saída normal
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results/junit.xml" },
  },
});
