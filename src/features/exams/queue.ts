import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ENCOUNTER_WORKER_EMBED, EXAM_ORDER_CATALOG_EMBED } from "@/lib/supabase/embeds";

export type ExamQueueOption = {
  id: string;
  label: string;
  status: string;
};

/**
 * Filas operacionais de exam_orders por result_type (lab / diagnostic / audiometry).
 */
export async function loadExamOrderQueue(input: {
  resultTypes: readonly string[];
  tenantId: string;
  limit?: number;
}): Promise<ExamQueueOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("exam_orders")
    .select(
      `id, status, ${EXAM_ORDER_CATALOG_EMBED}(code, name, result_type), encounters(${ENCOUNTER_WORKER_EMBED}(full_name))`,
    )
    .eq("tenant_id", input.tenantId)
    .in("status", ["ordered", "in_progress", "collected"])
    .order("created_at", { ascending: true })
    .limit(input.limit ?? 40);

  if (error || !data) return [];

  const allowed = new Set(input.resultTypes);
  return data
    .map((row) => {
      const catalog = Array.isArray(row.exam_catalog) ? row.exam_catalog[0] : row.exam_catalog;
      const encounter = Array.isArray(row.encounters) ? row.encounters[0] : row.encounters;
      const worker = encounter
        ? Array.isArray(encounter.workers)
          ? encounter.workers[0]
          : encounter.workers
        : null;
      const resultType = catalog?.result_type ?? "";
      if (!allowed.has(resultType)) return null;
      return {
        id: row.id,
        label: `${worker?.full_name ?? "Trabalhador"} · ${catalog?.code ?? "EXAME"} · ${catalog?.name ?? resultType} · ${row.status}`,
        status: row.status,
      };
    })
    .filter((row): row is ExamQueueOption => row !== null);
}
