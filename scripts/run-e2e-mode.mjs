import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const modeArg = process.argv[2];
const mode =
  modeArg === "smoke" || modeArg === "auth" || modeArg === "all"
    ? modeArg
    : (process.env.E2E_MODE ?? "all");
const args = process.argv.slice(
  modeArg === "smoke" || modeArg === "auth" || modeArg === "all" ? 3 : 2,
);
if (args[0] === "--") args.shift();

if (mode === "auth") {
  if (process.env.E2E_AUTH_ENABLED !== "1") {
    console.error("E2E_MODE=auth requires E2E_AUTH_ENABLED=1");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (
    !url ||
    url.includes("placeholder") ||
    url === "http://127.0.0.1:54321" ||
    url === "http://localhost:54321"
  ) {
    console.error("Authenticated E2E refuses placeholder Supabase URL.");
    process.exit(1);
  }
  for (const key of ["E2E_AUTH_EMAIL", "E2E_AUTH_PASSWORD"]) {
    if (!process.env[key]) {
      console.error(`Missing required env for authenticated E2E: ${key}`);
      process.exit(1);
    }
  }
}

mkdirSync("artifacts", { recursive: true });

const playwrightArgs = ["test", ...args];
if (mode === "smoke") {
  playwrightArgs.push("tests/e2e/public-and-auth.spec.ts");
} else if (mode === "auth") {
  playwrightArgs.push(
    "tests/e2e/authenticated-workspace.spec.ts",
    "tests/e2e/occupational-flow.spec.ts",
    "tests/e2e/clinical-close-flow.spec.ts",
    "tests/e2e/clinical-deep-flow.spec.ts",
  );
}

const child = spawn(process.execPath, ["scripts/run-e2e.mjs", "--", ...playwrightArgs], {
  env: {
    ...process.env,
    ...(mode === "smoke"
      ? {
          E2E_AUTH_ENABLED: "0",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "e2e-public-placeholder",
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
        }
      : {}),
  },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
