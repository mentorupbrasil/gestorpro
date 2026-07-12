import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env/server";

let sqlClient: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle> | undefined;

export function getDatabase() {
  if (!database) {
    sqlClient = postgres(getServerEnv().DATABASE_URL, {
      max: 10,
      prepare: false,
      transform: postgres.camel,
    });
    database = drizzle(sqlClient);
  }
  return database;
}
