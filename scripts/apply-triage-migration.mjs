import fs from "node:fs/promises";
import postgres from "postgres";

const connectionString =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? null;

const pgEnv = ["PGHOST", "PGPASSWORD"];

if (!connectionString) {
  for (const name of pgEnv) {
    if (!process.env[name]) {
      console.error(
        "MIGRATION_DATABASE_URL, DATABASE_URL or PGHOST+PGPASSWORD are required.",
      );
      process.exit(1);
    }
  }
}

const connection = connectionString
  ? postgres(connectionString, { idle_timeout: 2, max: 1, onnotice: () => {} })
  : postgres({
      database: process.env.PGDATABASE ?? "postgres",
      host: process.env.PGHOST,
      idle_timeout: 2,
      max: 1,
      onnotice: () => {},
      password: process.env.PGPASSWORD,
      port: Number(process.env.PGPORT ?? 5432),
      ssl: process.env.PGSSL === "false" ? false : "require",
      user: process.env.PGUSER ?? "postgres",
    });

const migrationPath =
  "supabase/migrations/202607140002_triage_operational_hardening.sql";

try {
  const migration = await fs.readFile(migrationPath, "utf8");
  await connection.unsafe(migration);
  console.log(`Applied ${migrationPath}`);
} finally {
  await connection.end({ timeout: 5 });
}
