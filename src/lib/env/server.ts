import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  APP_URL: z.url(),
  DATABASE_URL: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= serverEnvSchema.parse({
    APP_URL: process.env.APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  });
  return cachedServerEnv;
}
