import { existsSync, readFileSync } from "node:fs";
import fs from "node:fs/promises";
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
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvFile();

const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";
const migrationPath = "supabase/migrations/202607140007_p0_4_composite_tenant_fks_clinical.sql";

if (!process.env.PGHOST || !process.env.PGPASSWORD) {
  console.error("Configure PGHOST+PGPASSWORD (ou .env) do Supabase autorizado.");
  process.exit(1);
}

const sql = postgres({
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

try {
  const migration = await fs.readFile(migrationPath, "utf8");
  if (dryRun) {
    await sql
      .begin(async (tx) => {
        await tx.unsafe(migration);
        throw new Error("DRY_RUN_ROLLBACK");
      })
      .catch((error) => {
        if (error instanceof Error && error.message === "DRY_RUN_ROLLBACK") {
          console.log(`Dry-run OK: ${migrationPath} (rollback)`);
          return;
        }
        throw error;
      });
  } else {
    await sql.unsafe(migration);
    console.log(`Applied ${migrationPath}`);
  }
} finally {
  await sql.end({ timeout: 5 });
}
