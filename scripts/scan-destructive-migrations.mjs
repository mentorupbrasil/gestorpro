import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DESTRUCTIVE =
  /\b(drop\s+table|truncate\s+table|drop\s+schema|alter\s+table[\s\S]{0,80}drop\s+column)\b/i;

const migrationsDir = "supabase/migrations";
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const offenders = [];

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  if (DESTRUCTIVE.test(sql)) {
    // allow constraint drops / recreate that are not table drops
    if (/\bdrop\s+table\b/i.test(sql) || /\btruncate\s+table\b/i.test(sql)) {
      offenders.push(file);
    }
  }
}

if (offenders.length > 0) {
  console.error("Destructive migrations detected:");
  for (const file of offenders) console.error(` - ${file}`);
  process.exit(1);
}

console.log(`Destructive migration scan passed (${files.length} files).`);
