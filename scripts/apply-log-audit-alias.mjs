import { readFileSync } from "node:fs";
import postgres from "postgres";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const sql = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  max: 1,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
  ssl: "require",
  user: process.env.PGUSER,
});

try {
  const migration = readFileSync(
    "supabase/migrations/202607140005_log_audit_alias.sql",
    "utf8",
  );
  await sql.unsafe(migration);
  console.log("Applied 202607140005_log_audit_alias.sql");
} finally {
  await sql.end({ timeout: 5 });
}
