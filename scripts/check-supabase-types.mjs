import fs from "node:fs/promises";
import path from "node:path";
import { getSupabaseSchemaFingerprint } from "./supabase-schema-fingerprint.mjs";

const typePath = path.resolve("src/lib/supabase/database.generated.ts");
const fingerprintPath = path.resolve("src/lib/supabase/database.generated.sha256");

try {
  const [typeSource, recordedFingerprint, currentFingerprint] = await Promise.all([
    fs.readFile(typePath, "utf8"),
    fs.readFile(fingerprintPath, "utf8"),
    getSupabaseSchemaFingerprint(),
  ]);

  if (!typeSource.includes("export type Database")) {
    throw new Error("generated type file does not export Database");
  }

  if (recordedFingerprint.trim() !== currentFingerprint) {
    throw new Error("database migrations changed after the last official type generation");
  }
} catch (error) {
  console.error(
    `Supabase type check failed: ${error instanceof Error ? error.message : String(error)}. ` +
      "Run pnpm types:supabase:generate with temporary authorized credentials.",
  );
  process.exit(1);
}

console.log("Supabase generated types match the migration fingerprint.");
