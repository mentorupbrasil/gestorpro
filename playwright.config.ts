import { defineConfig, devices } from "@playwright/test";

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "on-first-retry" },
  webServer: skipWebServer
    ? undefined
    : {
        command: "node ./node_modules/next/dist/bin/next start -H 127.0.0.1",
        env: {
          APP_URL: process.env.APP_URL ?? "http://127.0.0.1:3000",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "e2e-public-placeholder",
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
        },
        reuseExistingServer: true,
        url: "http://127.0.0.1:3000",
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
