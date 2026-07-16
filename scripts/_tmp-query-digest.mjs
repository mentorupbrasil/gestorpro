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
const rows =
  await sql`select n.nspname, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname = 'digest' limit 5`;
console.log(rows);
await sql.end({ timeout: 5 });
