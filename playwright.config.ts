import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    env: {
      ...process.env,
      RESUME_STUDIO_DATA_DIR: ".tmp/playwright-resumes",
    },
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
