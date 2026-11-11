import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    // JUnit para o Jenkins publicar o relatório; no terminal, saída normal
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "./test-results/junit.xml" },
    // Só com "pnpm test:coverage" (o Jenkins usa esse). Abaixo de 90% o comando falha
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.spec.{ts,tsx}",
        // Dados e mocks dos testes
        "src/test/**",
        // <html> e <body> com as fontes e o CSS global: não monta dentro do jsdom (o E2E cobre)
        "src/app/layout.tsx",
      ],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
