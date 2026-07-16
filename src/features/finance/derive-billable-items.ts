import "server-only";

import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DerivedBillableItem = {
  billableCode: string;
  technicalRepeat: boolean;
};

/**
 * Deriva itens faturáveis dos serviços realmente executados no atendimento.
 * Não aceita códigos inventados pelo cliente (ex.: E2E_EXAM).
 */
export async function deriveBillableItemsFromEncounter(input: {
  encounterId: string;
  tenantId: string;
}): Promise<DerivedBillableItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data: orders, error } = await supabase
    .from("exam_orders")
    .select("status, exam_catalog_id")
    .eq("tenant_id", input.tenantId)
    .eq("encounter_id", input.encounterId)
    .neq("status", "cancelled");

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar exames do atendimento.", {
      cause: error,
      status: 500,
    });
  }

  const catalogIds = [...new Set((orders ?? []).map((order) => order.exam_catalog_id))];
  if (catalogIds.length === 0) {
    throw new AppError(
      "VALIDATION_FAILED",
      "Nenhum serviço executável encontrado para faturar neste atendimento.",
      { status: 422 },
    );
  }

  const { data: catalogs, error: catalogError } = await supabase
    .from("exam_catalog")
    .select("id, code")
    .eq("tenant_id", input.tenantId)
    .in("id", catalogIds);

  if (catalogError) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível resolver códigos do catálogo.", {
      cause: catalogError,
      status: 500,
    });
  }

  const items = (catalogs ?? [])
    .map((catalog) => catalog.code?.trim())
    .filter((code): code is string => Boolean(code))
    .map((billableCode) => ({ billableCode, technicalRepeat: false }));

  if (items.length === 0) {
    throw new AppError("VALIDATION_FAILED", "Catálogo sem códigos faturáveis para o atendimento.", {
      status: 422,
    });
  }

  return items;
}
