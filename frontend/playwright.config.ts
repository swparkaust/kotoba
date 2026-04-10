import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    permissions: ["notifications"],
  },
  webServer: {
    command: "docker compose -f docker-compose.test.yml up --build",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
