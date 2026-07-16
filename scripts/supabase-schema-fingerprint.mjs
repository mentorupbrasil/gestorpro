import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function getSupabaseSchemaFingerprint() {
  const migrationDirectory = path.resolve("supabase/migrations");
  const migrationNames = (await fs.readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const hash = createHash("sha256");

  for (const migrationName of migrationNames) {
    const raw = await fs.readFile(path.join(migrationDirectory, migrationName));
    const normalized = Buffer.from(raw.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    hash.update(migrationName);
    hash.update("\0");
    hash.update(normalized);
    hash.update("\0");
  }

  return hash.digest("hex");
}
