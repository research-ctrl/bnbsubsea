import { defineConfig } from "vitest/config";

// Unit tests only: kept apart from vite.config.ts so the vinext app plugins are not loaded for them.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
