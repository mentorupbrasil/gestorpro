import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
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
try {
  const migration = await fs.readFile(
    "supabase/migrations/202607140033_p1_p3_display_aso_close.sql",
    "utf8",
  );
  await connection.unsafe(migration);
  console.log("Migration 202607140033 applied.");
} catch (err) {
  console.error("SQL ERROR:", err.message);
  if (err.code) console.error("CODE:", err.code);
  process.exit(1);
} finally {
  await connection.end({ timeout: 5 });
}
