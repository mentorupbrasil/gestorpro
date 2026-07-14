import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = t.slice(i + 1).trim();
  }
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-one-migration.mjs <path.sql>");
  process.exit(1);
}

const sql = postgres({
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

try {
  await sql.unsafe(await fs.readFile(file, "utf8"));
  console.log("OK", file);
} catch (error) {
  console.error("FAIL", file, error?.message ?? error);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
