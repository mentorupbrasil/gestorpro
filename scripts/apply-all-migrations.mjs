import fs from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import postgres from "postgres";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(separator + 1).trim();
    }
  }
}

loadEnvFile();

const connection = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
  ssl: "require",
  user: process.env.PGUSER,
});

const skip = new Set(["202607120001_phase1_platform.sql"]);
const files = readdirSync("supabase/migrations")
  .filter((name) => name.endsWith(".sql") && !skip.has(name))
  .sort();

const applied = [];
const failed = [];

for (const file of files) {
  const path = `supabase/migrations/${file}`;
  try {
    const migration = await fs.readFile(path, "utf8");
    await connection.unsafe(migration);
    applied.push(file);
    console.log(`OK ${file}`);
  } catch (error) {
    failed.push({ file, message: error?.message ?? String(error) });
    console.error(`FAIL ${file}: ${error?.message ?? error}`);
  }
}

console.log(`\nApplied: ${applied.length}, failed: ${failed.length}`);
await connection.end({ timeout: 5 });
if (failed.length > 0) process.exit(1);
