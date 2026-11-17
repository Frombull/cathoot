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
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
