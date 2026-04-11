import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    permissions: ["notifications"],
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
