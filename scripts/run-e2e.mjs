import { spawn, spawnSync } from "node:child_process";
import http from "node:http";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const serverUrl = new URL(baseUrl);
const host = serverUrl.hostname;
const port = serverUrl.port || (serverUrl.protocol === "https:" ? "443" : "80");

function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve(true);
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(check, 500);
      });

      request.setTimeout(2_000, () => {
        request.destroy();
      });
    };

    check();
  });
}

function isServerReady(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(true);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1_000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

function stopServer(server) {
  if (!server?.pid) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  server.kill("SIGTERM");
}

const nextEnv = {
  ...process.env,
  APP_URL: process.env.APP_URL ?? baseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "e2e-public-placeholder",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
};

const playwrightArgs = process.argv.slice(2);
if (playwrightArgs[0] === "--") {
  playwrightArgs.shift();
}

let server;
let exitCode = 1;
const alreadyRunning = await isServerReady(baseUrl);

try {
  if (!alreadyRunning) {
    server = spawn(
      process.execPath,
      ["./node_modules/next/dist/bin/next", "start", "-H", host, "-p", port],
      {
        env: nextEnv,
        stdio: "inherit",
      },
    );

    await waitForServer(baseUrl);
  }

  const playwright = spawn(
    process.execPath,
    ["./node_modules/@playwright/test/cli.js", "test", ...playwrightArgs],
    {
      env: {
        ...nextEnv,
        PLAYWRIGHT_SKIP_WEBSERVER: "1",
      },
      stdio: "inherit",
    },
  );

  exitCode = await new Promise((resolve) => {
    playwright.on("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error);
  exitCode = 1;
} finally {
  if (!alreadyRunning) stopServer(server);
}

process.exit(exitCode);
