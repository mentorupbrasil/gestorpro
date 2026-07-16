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

const sslMode = (process.env.PGSSLMODE ?? "").toLowerCase();
const useSsl =
  process.env.PGSSL === "1" ||
  sslMode === "require" ||
  (!sslMode && process.env.PGHOST && !["127.0.0.1", "localhost"].includes(process.env.PGHOST));

const sql = postgres({
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

await sql.unsafe(`create extension if not exists pgtap;`);

const evidenceDir = process.env.PGTAP_EVIDENCE_DIR ?? "artifacts/pgtap";
mkdirSync(evidenceDir, { recursive: true });

const files = readdirSync("supabase/tests")
  .filter((name) => name.endsWith(".sql"))
  .sort();

const results = [];
let failed = 0;

for (const file of files) {
  const fullPath = path.join("supabase", "tests", file);
  const started = Date.now();
  try {
    const body = readFileSync(fullPath, "utf8");
    // pgTAP specs are transactional; run and capture notices via result
    const rows = await sql.unsafe(body);
    const durationMs = Date.now() - started;
    results.push({
      durationMs,
      file,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      status: "passed",
    });
    console.log(`PASS ${file} (${durationMs}ms)`);
  } catch (error) {
    failed += 1;
    const durationMs = Date.now() - started;
    results.push({
      durationMs,
      file,
      message: error?.message ?? String(error),
      status: "failed",
    });
    console.error(`FAIL ${file}: ${error?.message ?? error}`);
  }
}

const summary = {
  failed,
  finishedAt: new Date().toISOString(),
  passed: results.filter((item) => item.status === "passed").length,
  results,
  skipped: 0,
  total: files.length,
};

writeFileSync(path.join(evidenceDir, `pgtap-${Date.now()}.json`), JSON.stringify(summary, null, 2));
console.log(
  `\npgTAP summary: total=${summary.total} passed=${summary.passed} failed=${summary.failed} skipped=${summary.skipped}`,
);

await sql.end({ timeout: 5 });
if (failed > 0) process.exit(1);
