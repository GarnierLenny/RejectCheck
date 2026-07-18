import { defineConfig } from "vitest/config";

// Unit tests for pure display-only libs (app/lib/*). Playwright owns e2e/*.
export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.spec.ts"],
  },
});
