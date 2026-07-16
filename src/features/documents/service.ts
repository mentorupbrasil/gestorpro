import "server-only";

import { createHash } from "node:crypto";
import { requireAal2, requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import {
  assertAsoReadiness,
  assertPrivateDocumentPath,
  buildAsoPdfFromSnapshot,
  buildDocumentHash,
  buildGenericDocumentPdf,
  CLINICAL_PRIVATE_BUCKET,
  type AsoSnapshot,
  type DocumentType,
} from "@/features/documents/document-workflow";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const createDocumentVersionSchema = z.object({
  documentType: z.enum(["aso", "triage_form", "exam_report", "generic"]),
  encounterId: z.string().uuid(),
  hasMedicalConclusion: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(128),
  pendingRequiredExams: z.number().int().nonnegative().default(0),
  rectificationReason: z.string().trim().max(500).optional().default(""),
  snapshot: z.record(z.string(), z.unknown()),
  templateVersionId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export type CreateDocumentVersionInput = z.input<typeof createDocumentVersionSchema>;

export const signDocumentVersionSchema = z.object({
  contentHash: z.string().trim().min(16),
  documentVersionId: z.string().uuid(),
  method: z.enum(["password_reauth", "totp", "webauthn"]).default("totp"),
  tenantId: z.string().uuid(),
});

export type SignDocumentVersionInput = z.input<typeof signDocumentVersionSchema>;

async function loadOperationalAsoSnapshot(input: {
  encounterId: string;
  tenantId: string;
}): Promise<AsoSnapshot> {
  const supabase = await createServerSupabaseClient();

  const { data: encounter, error: encounterError } = await supabase
    .from("encounters")
    .select("id, clinic_unit_id, worker_id, referral_id, tenant_id")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.encounterId)
    .maybeSingle();

  if (encounterError || !encounter) {
    throw new AppError("VALIDATION_FAILED", "Atendimento não encontrado para ASO.", {
      cause: encounterError,
      status: 404,
    });
  }

  const [workerResult, conclusionResult, ordersResult, snapshotResult, referralResult] =
    await Promise.all([
      supabase
        .from("workers")
        .select("full_name, cpf_lookup_hash")
        .eq("tenant_id", input.tenantId)
        .eq("id", encounter.worker_id)
        .maybeSingle(),
      supabase
        .from("medical_conclusions")
        .select(
          "conclusion_code, restrictions, signature_status, signed_at, physician_credential_id, version",
        )
        .eq("tenant_id", input.tenantId)
        .eq("encounter_id", input.encounterId)
        .maybeSingle(),
      supabase
        .from("exam_orders")
        .select("status, exam_catalog_id, created_at, protocol_snapshot")
        .eq("tenant_id", input.tenantId)
        .eq("encounter_id", input.encounterId),
      supabase
        .from("encounter_snapshots")
        .select("payload")
        .eq("tenant_id", input.tenantId)
        .eq("encounter_id", input.encounterId)
        .maybeSingle(),
      encounter.referral_id
        ? supabase
            .from("referrals")
            .select("company_id, occupational_exam_type, employment_contract_id")
            .eq("tenant_id", input.tenantId)
            .eq("id", encounter.referral_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  if (workerResult.error || !workerResult.data) {
    throw new AppError("VALIDATION_FAILED", "Trabalhador do atendimento ausente para ASO.", {
      status: 422,
    });
  }
  if (conclusionResult.error || !conclusionResult.data) {
    throw new AppError("VALIDATION_FAILED", "Conclusão médica ausente para ASO.", { status: 422 });
  }
  if (conclusionResult.data.signature_status !== "signed") {
    throw new AppError("VALIDATION_FAILED", "Conclusão médica precisa estar assinada.", {
      status: 409,
    });
  }

  const companyId = referralResult.data?.company_id;
  if (!companyId) {
    throw new AppError("VALIDATION_FAILED", "Empresa do atendimento ausente para ASO.", {
      status: 422,
    });
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("legal_name, trade_name, tax_id_normalized")
    .eq("tenant_id", input.tenantId)
    .eq("id", companyId)
    .maybeSingle();

  if (companyError || !company) {
    throw new AppError("VALIDATION_FAILED", "Empresa do atendimento ausente para ASO.", {
      status: 422,
    });
  }

  const catalogIds = (ordersResult.data ?? [])
    .map((order) => order.exam_catalog_id)
    .filter(Boolean) as string[];

  const { data: catalogs } =
    catalogIds.length > 0
      ? await supabase
          .from("exam_catalog")
          .select("id, code, name")
          .eq("tenant_id", input.tenantId)
          .in("id", catalogIds)
      : { data: [] };

  const catalogById = new Map((catalogs ?? []).map((row) => [row.id, row]));

  let physicianName = "Medico responsavel";
  let councilNumber = "";
  let councilRegion = "";
  const { data: credential } = await supabase
    .from("clinical_professional_credentials")
    .select("registration_number, council_region, user_id")
    .eq("tenant_id", input.tenantId)
    .eq("id", conclusionResult.data.physician_credential_id)
    .maybeSingle();

  if (credential) {
    councilNumber = credential.registration_number ?? "";
    councilRegion = credential.council_region ?? "";
    if (credential.user_id) {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("display_name")
        .eq("id", credential.user_id)
        .maybeSingle();
      physicianName = profile?.display_name ?? physicianName;
    }
  }

  if (!councilNumber) {
    throw new AppError("VALIDATION_FAILED", "Credencial médica incompleta para ASO.", {
      status: 422,
    });
  }

  const frozen =
    snapshotResult.data?.payload && typeof snapshotResult.data.payload === "object"
      ? (snapshotResult.data.payload as Record<string, unknown>)
      : {};

  const firstProtocol =
    ordersResult.data?.[0]?.protocol_snapshot &&
    typeof ordersResult.data[0].protocol_snapshot === "object"
      ? (ordersResult.data[0].protocol_snapshot as Record<string, unknown>)
      : {};

  const restrictionsRaw = conclusionResult.data.restrictions;
  const restrictions = Array.isArray(restrictionsRaw)
    ? restrictionsRaw.map((item) => String(item))
    : typeof restrictionsRaw === "object" && restrictionsRaw
      ? Object.values(restrictionsRaw as Record<string, unknown>).map(String)
      : [];

  const cnpj = company.tax_id_normalized ?? "";
  const cpfHash = workerResult.data.cpf_lookup_hash ?? "";
  const cnpjMasked = cnpj ? `${cnpj.slice(0, 2)}.***.***/****-${cnpj.slice(-2)}` : null;
  const cpfMasked = cpfHash ? `***.***.***-${cpfHash.slice(-2)}` : null;
  const pcmsoVersion =
    typeof firstProtocol.pcmsoVersionId === "string" ||
    typeof firstProtocol.pcmsoVersionId === "number"
      ? firstProtocol.pcmsoVersionId
      : null;
  const protocolVersion =
    typeof firstProtocol.protocolId === "string" || typeof firstProtocol.protocolId === "number"
      ? firstProtocol.protocolId
      : null;

  const snapshot: AsoSnapshot = {
    company: {
      legalName: company.legal_name,
      ...(company.trade_name ? { fantasyName: company.trade_name } : {}),
      ...(cnpjMasked ? { cnpjMasked } : {}),
    },
    conclusion: {
      restrictions,
      ...(conclusionResult.data.conclusion_code
        ? { code: conclusionResult.data.conclusion_code }
        : {}),
      ...(conclusionResult.data.signed_at ? { signedAt: conclusionResult.data.signed_at } : {}),
    },
    encounter: {
      clinicUnitId: encounter.clinic_unit_id,
      id: encounter.id,
      ...(referralResult.data?.occupational_exam_type
        ? { examType: referralResult.data.occupational_exam_type }
        : {}),
      ...(pcmsoVersion !== null ? { pcmsoVersion } : {}),
      ...(protocolVersion !== null ? { protocolVersion } : {}),
    },
    exams: (ordersResult.data ?? []).map((order) => {
      const catalog = catalogById.get(order.exam_catalog_id);
      return {
        ...(catalog?.code ? { code: catalog.code } : {}),
        ...(order.created_at ? { date: order.created_at } : {}),
        ...(catalog?.name ? { name: catalog.name } : {}),
      };
    }),
    issuedAt: new Date().toISOString(),
    physician: {
      councilNumber,
      councilRegion,
      name: physicianName,
    },
    risks: Array.isArray(frozen.riskCodes)
      ? (frozen.riskCodes as unknown[]).map(String)
      : Array.isArray(firstProtocol.riskCodes)
        ? (firstProtocol.riskCodes as unknown[]).map(String)
        : [],
    tenantId: encounter.tenant_id,
    verificationCode: createHash("sha256")
      .update(`${encounter.id}:${conclusionResult.data.version}`)
      .digest("hex")
      .slice(0, 12)
      .toUpperCase(),
    worker: {
      name: workerResult.data.full_name,
      ...(cpfMasked ? { cpfMasked } : {}),
      ...(typeof frozen.jobPosition === "string" ? { functionName: frozen.jobPosition } : {}),
      ...(typeof frozen.exposureGroup === "string" ? { ghe: frozen.exposureGroup } : {}),
      ...(typeof frozen.sector === "string" ? { sector: frozen.sector } : {}),
    },
  };

  return snapshot;
}

export async function createGeneratedDocumentVersion(
  input: CreateDocumentVersionInput,
  requestId: string,
) {
  const parsed = createDocumentVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "documents.manage");
  requireAal2(context);

  assertAsoReadiness({
    documentType: parsed.documentType as DocumentType,
    hasMedicalConclusion: parsed.hasMedicalConclusion,
    pendingRequiredExams: parsed.pendingRequiredExams,
  });

  const operationalSnapshot =
    parsed.documentType === "aso"
      ? await loadOperationalAsoSnapshot({
          encounterId: parsed.encounterId,
          tenantId: context.tenantId,
        })
      : parsed.snapshot;

  const snapshotHash = buildDocumentHash(operationalSnapshot);
  const supabase = await createServerSupabaseClient();
  const { data: versionId, error } = await supabase.rpc("create_generated_document_version", {
    audit_request_id: requestId,
    content_hash_value: snapshotHash,
    document_type_value: parsed.documentType,
    idempotency_key_value: parsed.idempotencyKey,
    rectification_reason_value: parsed.rectificationReason,
    snapshot_payload_value: operationalSnapshot,
    storage_path_value: "",
    target_encounter_id: parsed.encounterId,
    target_template_version_id: parsed.templateVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof versionId !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível gerar documento.", {
      cause: error,
      status: 500,
    });
  }

  const { data: versionRow, error: versionError } = await supabase
    .from("document_versions")
    .select("id, storage_path, storage_bucket, render_status")
    .eq("tenant_id", context.tenantId)
    .eq("id", versionId)
    .maybeSingle();

  if (versionError || !versionRow?.storage_path) {
    throw new AppError("INTERNAL_ERROR", "Versão criada sem caminho de storage.", {
      cause: versionError,
      status: 500,
    });
  }

  assertPrivateDocumentPath({
    bucket: versionRow.storage_bucket ?? CLINICAL_PRIVATE_BUCKET,
    path: versionRow.storage_path,
  });

  let renderStatus = versionRow.render_status ?? "pending";
  let contentHash = snapshotHash;

  try {
    const pdfBytes =
      parsed.documentType === "aso"
        ? buildAsoPdfFromSnapshot({
            snapshot: operationalSnapshot as AsoSnapshot,
            versionId,
          })
        : buildGenericDocumentPdf({
            documentType: parsed.documentType as DocumentType,
            versionId,
          });

    if (pdfBytes.byteLength <= 0) {
      throw new AppError("INTERNAL_ERROR", "PDF gerado vazio.", { status: 500 });
    }
    contentHash = createHash("sha256").update(pdfBytes).digest("hex");

    const admin = createAdminSupabaseClient();
    const { error: uploadError } = await admin.storage
      .from(CLINICAL_PRIVATE_BUCKET)
      .upload(versionRow.storage_path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: finalizeError } = await supabase.rpc("finalize_document_version_render", {
      audit_request_id: requestId,
      content_hash_value: contentHash,
      render_status_value: "rendered",
      target_document_version_id: versionId,
      target_tenant_id: context.tenantId,
    });

    if (finalizeError) {
      throw finalizeError;
    }

    renderStatus = "rendered";
  } catch (cause) {
    throw new AppError(
      "INTERNAL_ERROR",
      cause instanceof AppError && cause.message.includes("SUPABASE_SERVICE_ROLE_KEY")
        ? "Configure SUPABASE_SERVICE_ROLE_KEY para gravar o PDF privado."
        : "Falha ao renderizar/gravar PDF no storage privado.",
      { cause, status: 500 },
    );
  }

  return { contentHash, renderStatus, versionId };
}

export async function signDocumentVersion(input: SignDocumentVersionInput, requestId: string) {
  const parsed = signDocumentVersionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "documents.sign");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("sign_document_version", {
    audit_request_id: requestId,
    content_hash_value: parsed.contentHash,
    method_value: parsed.method,
    target_document_version_id: parsed.documentVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    const message = error?.message ?? "";
    if (/pending|failed|hash|permission|aal2/i.test(message)) {
      throw new AppError("VALIDATION_FAILED", message || "Assinatura recusada.", {
        cause: error,
        status: 422,
      });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível assinar o documento.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
