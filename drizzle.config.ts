import { defineConfig } from "drizzle-kit";

if (!process.env.MIGRATION_DATABASE_URL) {
  throw new Error("MIGRATION_DATABASE_URL é obrigatória para executar o Drizzle Kit.");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./supabase/migrations",
  schema: "./src/lib/db/schema.ts",
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL },
  strict: true,
  verbose: true,
});
