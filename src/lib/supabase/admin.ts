import "server-only";

import { createClient } from "@supabase/supabase-js";
import { AppError } from "@/core/errors/app-error";
import { getPublicEnv } from "@/lib/env/public";

export function createAdminSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new AppError(
      "INTERNAL_ERROR",
      "SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor. Adicione no arquivo .env local.",
      { status: 500 },
    );
  }

  const env = getPublicEnv();

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
