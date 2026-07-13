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
    hash.update(migrationName);
    hash.update("\0");
    hash.update(await fs.readFile(path.join(migrationDirectory, migrationName)));
    hash.update("\0");
  }

  return hash.digest("hex");
}
