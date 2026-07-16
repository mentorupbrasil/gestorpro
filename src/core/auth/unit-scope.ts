import "server-only";

import { requireUnitPermission, type AuthorizationContext } from "@/core/auth/authorization";
import type { Permission } from "@/core/auth/permissions";
import { AppError } from "@/core/errors/app-error";
import { readEmbeddedRelation } from "@/lib/supabase/relations";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

function requireResolvedUnit(
  context: AuthorizationContext,
  clinicUnitId: string | null | undefined,
  permission: Permission,
  missingMessage: string,
) {
  if (!clinicUnitId) {
    throw new AppError("VALIDATION_FAILED", missingMessage, { status: 404 });
  }
  requireUnitPermission(context, clinicUnitId, permission);
}

export async function requirePermissionOnExamOrder(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  examOrderId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("exam_orders")
    .select("id, encounters!inner(clinic_unit_id)")
    .eq("tenant_id", context.tenantId)
    .eq("id", examOrderId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Ordem de exame não encontrada.", {
      cause: error,
      status: 404,
    });
  }

  requireResolvedUnit(
    context,
    readEmbeddedRelation(data.encounters)?.clinic_unit_id,
    permission,
    "Ordem de exame sem unidade.",
  );
}

export async function requirePermissionOnExamResult(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  table:
    | "visual_acuity_results"
    | "audiometry_results"
    | "spirometry_results"
    | "diagnostic_exam_results",
  resultId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from(table)
    .select("id, exam_orders!inner(encounters!inner(clinic_unit_id))")
    .eq("tenant_id", context.tenantId)
    .eq("id", resultId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Resultado de exame não encontrado.", {
      cause: error,
      status: 404,
    });
  }

  const order = readEmbeddedRelation(
    (
      data as {
        exam_orders?: { encounters?: { clinic_unit_id: string } | { clinic_unit_id: string }[] };
      }
    ).exam_orders,
  );
  requireResolvedUnit(
    context,
    readEmbeddedRelation(order?.encounters)?.clinic_unit_id,
    permission,
    "Resultado sem unidade.",
  );
}

export async function requirePermissionOnAppointment(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  appointmentId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, clinic_unit_id")
    .eq("tenant_id", context.tenantId)
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Agendamento não encontrado.", {
      cause: error,
      status: 404,
    });
  }

  requireResolvedUnit(context, data.clinic_unit_id, permission, "Agendamento sem unidade.");
}

export async function requirePermissionOnClinicUnitRow(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  clinicUnitId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("clinic_units")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .eq("id", clinicUnitId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Unidade não encontrada.", {
      cause: error,
      status: 404,
    });
  }

  requireUnitPermission(context, clinicUnitId, permission);
}

export async function requirePermissionOnLaboratorySample(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  sampleId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("laboratory_samples")
    .select("id, laboratory_orders!inner(encounters!inner(clinic_unit_id))")
    .eq("tenant_id", context.tenantId)
    .eq("id", sampleId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Amostra laboratorial não encontrada.", {
      cause: error,
      status: 404,
    });
  }

  const order = readEmbeddedRelation(
    (
      data as {
        laboratory_orders?: {
          encounters?: { clinic_unit_id: string } | { clinic_unit_id: string }[];
        };
      }
    ).laboratory_orders,
  );
  requireResolvedUnit(
    context,
    readEmbeddedRelation(order?.encounters)?.clinic_unit_id,
    permission,
    "Amostra sem unidade.",
  );
}

export async function requirePermissionOnLaboratoryOrderItem(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  orderItemId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("laboratory_order_items")
    .select("id, laboratory_orders!inner(encounters!inner(clinic_unit_id))")
    .eq("tenant_id", context.tenantId)
    .eq("id", orderItemId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Item laboratorial não encontrado.", {
      cause: error,
      status: 404,
    });
  }

  const order = readEmbeddedRelation(
    (
      data as {
        laboratory_orders?: {
          encounters?: { clinic_unit_id: string } | { clinic_unit_id: string }[];
        };
      }
    ).laboratory_orders,
  );
  requireResolvedUnit(
    context,
    readEmbeddedRelation(order?.encounters)?.clinic_unit_id,
    permission,
    "Item laboratorial sem unidade.",
  );
}

export async function requirePermissionOnQueueTicket(
  supabase: ServerSupabase,
  context: AuthorizationContext,
  queueTicketId: string,
  permission: Permission,
) {
  const { data, error } = await supabase
    .from("queue_tickets")
    .select("id, encounters!inner(clinic_unit_id)")
    .eq("tenant_id", context.tenantId)
    .eq("id", queueTicketId)
    .maybeSingle();

  if (error || !data) {
    throw new AppError("VALIDATION_FAILED", "Senha de fila não encontrada.", {
      cause: error,
      status: 404,
    });
  }

  requireResolvedUnit(
    context,
    readEmbeddedRelation(data.encounters)?.clinic_unit_id,
    permission,
    "Senha sem unidade.",
  );
}
