import "server-only";

import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { assertCommercialDoesNotChangeClinicalProtocol } from "@/features/finance/finance-workflow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const snapshotItemSchema = z.object({
  billableCode: z.string().trim().min(1).max(64),
  nonBillableReason: z.string().trim().max(200).optional(),
  technicalRepeat: z.boolean().default(false),
});

export const createPriceSnapshotSchema = z.object({
  clinicalProtocolChanged: z.boolean().default(false),
  contractId: z.string().uuid(),
  encounterId: z.string().uuid(),
  items: z.array(snapshotItemSchema).min(1),
  priceTableId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type CreatePriceSnapshotInput = z.input<typeof createPriceSnapshotSchema>;

export const createBillingFromSnapshotSchema = z.object({
  snapshotId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type CreateBillingFromSnapshotInput = z.infer<typeof createBillingFromSnapshotSchema>;

export const issueInvoiceSchema = z.object({
  billingItemIds: z.array(z.string().uuid()).min(1),
  companyId: z.string().uuid(),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tenantId: z.string().uuid(),
});

export type IssueInvoiceInput = z.infer<typeof issueInvoiceSchema>;

export const recordPaymentSchema = z.object({
  amountCents: z.number().int().positive(),
  invoiceId: z.string().uuid(),
  method: z.string().trim().min(2).max(64),
  paidAt: z.string().datetime().optional(),
  reference: z.string().trim().max(128).optional().default(""),
  tenantId: z.string().uuid(),
});

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

export async function createEncounterPriceSnapshot(
  input: CreatePriceSnapshotInput,
  requestId: string,
) {
  const parsed = createPriceSnapshotSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "finance.manage");
  requireAal2(context);
  assertCommercialDoesNotChangeClinicalProtocol({
    clinicalProtocolChanged: parsed.clinicalProtocolChanged,
  });

  // Preço e hash são resolvidos/congelados na RPC a partir da tabela aprovada.
  const snapshotPayload = {
    items: parsed.items.map((item) => ({
      billableCode: item.billableCode,
      nonBillableReason: item.nonBillableReason,
      technicalRepeat: item.technicalRepeat,
    })),
  };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_encounter_price_snapshot", {
    audit_request_id: requestId,
    content_hash_value: "",
    snapshot_payload_value: snapshotPayload,
    target_contract_id: parsed.contractId,
    target_encounter_id: parsed.encounterId,
    target_price_table_id: parsed.priceTableId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar snapshot de preço.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createBillingFromSnapshot(
  input: CreateBillingFromSnapshotInput,
  requestId: string,
) {
  const parsed = createBillingFromSnapshotSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "finance.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_billing_from_snapshot", {
    audit_request_id: requestId,
    target_snapshot_id: parsed.snapshotId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "number") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gerar faturamento do snapshot.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function issueInvoice(input: IssueInvoiceInput, requestId: string) {
  const parsed = issueInvoiceSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "finance.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("issue_invoice", {
    audit_request_id: requestId,
    billing_item_ids: parsed.billingItemIds,
    due_on_value: parsed.dueOn,
    target_company_id: parsed.companyId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível emitir fatura.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function recordInvoicePayment(input: RecordPaymentInput, requestId: string) {
  const parsed = recordPaymentSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "finance.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("record_invoice_payment", {
    amount_cents_value: parsed.amountCents,
    audit_request_id: requestId,
    method_value: parsed.method,
    paid_at_value: parsed.paidAt ?? new Date().toISOString(),
    reference_value: parsed.reference,
    target_invoice_id: parsed.invoiceId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar pagamento.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
