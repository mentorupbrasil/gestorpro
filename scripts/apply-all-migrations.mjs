import fs from "node:fs/promises";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
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

const MODE = (process.env.MIGRATE_MODE ?? process.argv[2] ?? "").trim().toLowerCase();
const EVIDENCE_DIR = process.env.MIGRATE_EVIDENCE_DIR ?? "artifacts/migrations";
const LEDGER_TABLE = "public.schema_migration_ledger";

if (MODE !== "fresh" && MODE !== "upgrade") {
  console.error(
    "Usage: MIGRATE_MODE=fresh|upgrade node scripts/apply-all-migrations.mjs\n" +
      "  fresh   — empty DB: apply phase1 + all remaining migrations in order\n" +
      "  upgrade — apply only migrations not yet recorded in schema_migration_ledger",
  );
  process.exit(2);
}

const sslMode = (process.env.PGSSLMODE ?? "").toLowerCase();
const useSsl =
  process.env.PGSSL === "1" ||
  sslMode === "require" ||
  sslMode === "verify-full" ||
  (!sslMode && process.env.PGHOST && !["127.0.0.1", "localhost"].includes(process.env.PGHOST));

const connection = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: useSsl ? "require" : false,
  user: process.env.PGUSER,
});

const PHASE1 = "202607120001_phase1_platform.sql";

function listMigrationFiles() {
  return readdirSync("supabase/migrations")
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

async function ensureLedger() {
  await connection.unsafe(`
    create table if not exists ${LEDGER_TABLE} (
      filename text primary key,
      checksum text not null,
      applied_at timestamptz not null default now(),
      duration_ms int not null,
      mode text not null check (mode in ('fresh', 'upgrade'))
    );
  `);
}

async function tableCount() {
  const rows = await connection`
    select count(*)::int as count
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  `;
  return rows[0]?.count ?? 0;
}

async function appliedSet() {
  const rows = await connection.unsafe(`select filename from ${LEDGER_TABLE} order by filename`);
  return new Set(rows.map((row) => row.filename));
}

async function sha256(content) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(content).digest("hex");
}

async function applyOne(file, mode) {
  const filePath = path.join("supabase", "migrations", file);
  const migration = await fs.readFile(filePath, "utf8");
  const checksum = await sha256(migration);
  const started = Date.now();
  await connection.unsafe(migration);
  const durationMs = Date.now() - started;
  await connection.unsafe(
    `insert into ${LEDGER_TABLE} (filename, checksum, duration_ms, mode)
     values ('${file.replace(/'/g, "''")}', '${checksum}', ${durationMs}, '${mode}')
     on conflict (filename) do update
       set checksum = excluded.checksum,
           applied_at = now(),
           duration_ms = excluded.duration_ms,
           mode = excluded.mode`,
  );
  console.log(`OK ${file} (${durationMs}ms)`);
  return { checksum, durationMs, file, status: "ok" };
}

const allFiles = listMigrationFiles();
const evidence = {
  applied: [],
  failed: null,
  mode: MODE,
  startedAt: new Date().toISOString(),
  totals: { applied: 0, durationMs: 0, skipped: 0 },
};

try {
  await ensureLedger();
  const publicTables = await tableCount();
  const already = await appliedSet();

  let queue = [];

  if (MODE === "fresh") {
    if (publicTables > 1 || already.size > 0) {
      // Allow ledger-only emptyish DBs created by ensureLedger itself.
      const nonLedgerTables = await connection`
        select count(*)::int as count
        from information_schema.tables
        where table_schema = 'public'
          and table_type = 'BASE TABLE'
          and table_name <> 'schema_migration_ledger'
      `;
      if ((nonLedgerTables[0]?.count ?? 0) > 0 || already.size > 0) {
        throw new Error(
          `fresh mode requires an empty public schema (found ${nonLedgerTables[0]?.count ?? 0} tables, ${already.size} ledger rows)`,
        );
      }
    }
    if (!allFiles.includes(PHASE1)) {
      throw new Error(`Missing required initial migration ${PHASE1}`);
    }
    queue = allFiles;
    console.log(`MODE=fresh — applying ${queue.length} migrations including ${PHASE1}`);
  } else {
    // upgrade: skip already-applied; if ledger empty but DB has tables, skip PHASE1 only (legacy)
    if (already.size === 0 && publicTables > 1) {
      console.warn(
        "upgrade: empty ledger on non-empty DB — treating as legacy baseline; skipping phase1 and recording remaining as upgrade",
      );
      queue = allFiles.filter((name) => name !== PHASE1);
    } else {
      queue = allFiles.filter((name) => !already.has(name));
    }
    console.log(`MODE=upgrade — applying ${queue.length} pending migrations`);
  }

  for (const file of queue) {
    try {
      const result = await applyOne(file, MODE);
      evidence.applied.push(result);
      evidence.totals.applied += 1;
      evidence.totals.durationMs += result.durationMs;
    } catch (error) {
      evidence.failed = {
        file,
        message: error?.message ?? String(error),
      };
      console.error(`FAIL ${file}: ${error?.message ?? error}`);
      throw error;
    }
  }

  evidence.totals.skipped = allFiles.length - evidence.totals.applied;
  evidence.finishedAt = new Date().toISOString();
  console.log(
    `\nDone mode=${MODE}: applied=${evidence.totals.applied} skipped=${evidence.totals.skipped} durationMs=${evidence.totals.durationMs}`,
  );
} catch (error) {
  evidence.finishedAt = new Date().toISOString();
  evidence.error = error?.message ?? String(error);
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  writeFileSync(
    path.join(EVIDENCE_DIR, `migrate-${MODE}-${Date.now()}.json`),
    JSON.stringify(evidence, null, 2),
  );
  await connection.end({ timeout: 5 });
  process.exit(1);
}

mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(
  path.join(EVIDENCE_DIR, `migrate-${MODE}-${Date.now()}.json`),
  JSON.stringify(evidence, null, 2),
);
await connection.end({ timeout: 5 });
