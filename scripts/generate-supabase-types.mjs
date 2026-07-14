import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseSchemaFingerprint } from "./supabase-schema-fingerprint.mjs";

const projectId = process.env.SUPABASE_PROJECT_ID;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectId || !accessToken) {
  console.warn(
    "SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN not set; generating offline types from migrations.",
  );
  const offline = spawnSync(process.execPath, ["scripts/generate-supabase-types-offline.mjs"], {
    encoding: "utf8",
    stdio: "inherit",
  });
  process.exit(offline.status ?? 1);
}

const result = spawnSync(
  "corepack",
  [
    "pnpm",
    "exec",
    "supabase",
    "gen",
    "types",
    "typescript",
    "--project-id",
    projectId,
    "--schema",
    "public",
  ],
  {
    encoding: "utf8",
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
    shell: process.platform === "win32",
  },
);

if (result.status !== 0) {
  console.error(result.stderr || "Supabase typegen failed.");
  process.exit(result.status ?? 1);
}

if (!result.stdout.includes("export type Database")) {
  console.error(
    "Supabase typegen returned an unexpected payload; generated files were not changed.",
  );
  process.exit(1);
}

const outputDirectory = path.resolve("src/lib/supabase");
const typePath = path.join(outputDirectory, "database.generated.ts");
const temporaryTypePath = `${typePath}.tmp`;
const fingerprintPath = path.join(outputDirectory, "database.generated.sha256");
const fingerprint = await getSupabaseSchemaFingerprint();

await fs.writeFile(temporaryTypePath, result.stdout, { encoding: "utf8", mode: 0o600 });
await fs.rename(temporaryTypePath, typePath);
await fs.writeFile(fingerprintPath, `${fingerprint}\n`, { encoding: "utf8", mode: 0o600 });

const format = spawnSync(
  process.execPath,
  [path.resolve("node_modules/prettier/bin/prettier.cjs"), "--write", typePath],
  { encoding: "utf8", stdio: "inherit" },
);
if (format.status !== 0) {
  console.error("Prettier failed on generated Supabase types.");
  process.exit(format.status ?? 1);
}

console.log("Official Supabase types generated and schema fingerprint updated.");
