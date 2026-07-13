import "server-only";

import { requireAal2, requirePermission, requireUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  approvedTriageFormVersionSchema,
  closeMedicalConsultationSchema,
  createMedicalConclusionSchema,
  saveTriageRecordSchema,
  triageQueueListSchema,
  triageQueueRowSchema,
  triageWorkspaceRecordSchema,
  type CloseMedicalConsultationInput,
  type CreateMedicalConclusionInput,
  type SaveTriageRecordInput,
} from "./schemas";
import {
  formatWaitDuration,
  occupationalExamTypeLabels,
  parseTriageStoredPayload,
  triageInputFromStored,
  type TriageStoredPayload,
} from "./triage-payload";

export type TriageQueueItem = {
  checkedInAt: string;
  clinicUnitName: string;
  companyName: string;
  encounterId: string;
  examTypeLabel: string;
  hasPendingItems: boolean;
  priority: number | null;
  queueName: string | null;
  recordStatus: string | null;
  status: string;
  stepStatus: string;
  triageRecordId: string | null;
  waitLabel: string;
  workerName: string;
};

export type TriageWorkspace = {
  formVersion: { id: string; label: string };
  professionalName: string;
  queue: readonly TriageQueueItem[];
  selectedEncounter: TriageQueueItem | null;
  selectedRecord: {
    currentVersion: number;
    encounterId: string;
    payload: TriageStoredPayload;
    recordId: string;
    status: string;
  } | null;
};

function resolvePendingIndication(row: {
  encounter_steps: ReadonlyArray<{ status: string; step_type: string }>;
  queue_tickets: ReadonlyArray<{ status: string }>;
  triage_records: ReadonlyArray<{ status: string }>;
}) {
  const triageStep = row.encounter_steps.find((step) => step.step_type === "triage");
  const triageRecord = row.triage_records[0];

  if (triageStep?.status === "blocked") return true;
  if (triageRecord?.status === "reopened") return true;
  return row.queue_tickets.some((ticket) => ticket.status === "called");
}

function mapQueueRow(
  row: (typeof triageQueueListSchema)["_output"][number],
  now = Date.now(),
): TriageQueueItem {
  const triageStep = row.encounter_steps.find((step) => step.step_type === "triage");
  const ticket = row.queue_tickets[0];
  const triageRecord = row.triage_records[0];

  return {
    checkedInAt: row.checked_in_at,
    clinicUnitName: row.clinic_units?.name ?? "Unidade",
    companyName: row.referrals?.companies?.legal_name ?? "Empresa não informada",
    encounterId: row.id,
    examTypeLabel:
      occupationalExamTypeLabels[row.referrals?.occupational_exam_type ?? ""] ??
      row.referrals?.occupational_exam_type ??
      "Exame ocupacional",
    hasPendingItems: resolvePendingIndication(row),
    priority: ticket?.priority ?? null,
    queueName: ticket?.queue_definitions?.name ?? null,
    recordStatus: triageRecord?.status ?? null,
    status: row.status,
    stepStatus: triageStep?.status ?? "pending",
    triageRecordId: triageRecord?.id ?? null,
    waitLabel: formatWaitDuration(row.checked_in_at, now),
    workerName: row.workers?.full_name ?? "Trabalhador",
  };
}

export async function loadTriageWorkspace(
  tenantId: string,
  selectedEncounterId?: string,
): Promise<TriageWorkspace> {
  const context = await resolveAuthorizationContext(tenantId);
  requirePermission(context, "clinical.read");

  const unitIds = Array.from(context.clinicUnitIds);
  const supabase = await createServerSupabaseClient();

  const [formVersionResult, profileResult, queueResult] = await Promise.all([
    supabase
      .from("triage_form_versions")
      .select("id, version, triage_form_templates(name)")
      .eq("tenant_id", context.tenantId)
      .eq("status", "approved")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_profiles").select("display_name").eq("id", context.userId).maybeSingle(),
    unitIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("encounters")
          .select(
            `
            id,
            status,
            checked_in_at,
            clinic_unit_id,
            workers(full_name),
            referrals(occupational_exam_type, companies(legal_name)),
            clinic_units(name),
            encounter_steps(step_type, status, id),
            queue_tickets(priority, status, queue_definitions(name)),
            triage_records(id, status, current_version)
          `,
          )
          .eq("tenant_id", context.tenantId)
          .in("clinic_unit_id", unitIds)
          .in("status", ["checked_in", "waiting", "in_progress"])
          .order("checked_in_at"),
  ]);

  if (formVersionResult.error || profileResult.error || queueResult.error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a estação de triagem.", {
      cause: formVersionResult.error ?? profileResult.error ?? queueResult.error,
      status: 500,
    });
  }

  const formVersion = formVersionResult.data
    ? approvedTriageFormVersionSchema.parse(formVersionResult.data)
    : null;
  const queueRows = triageQueueListSchema.parse(queueResult.data ?? []);
  const queue = queueRows
    .filter((row) => {
      const triageStep = row.encounter_steps.find((step) => step.step_type === "triage");
      const triageRecord = row.triage_records[0];
      if (!triageStep) return false;
      if (triageRecord?.status === "closed") return false;
      return ["available", "in_progress", "pending", "blocked"].includes(triageStep.status);
    })
    .map((row) => mapQueueRow(row))
    .sort((left, right) => {
      const leftPriority = left.priority ?? 999;
      const rightPriority = right.priority ?? 999;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return new Date(left.checkedInAt).getTime() - new Date(right.checkedInAt).getTime();
    });

  let selectedRecord: TriageWorkspace["selectedRecord"] = null;
  let selectedEncounter: TriageQueueItem | null = null;
  if (selectedEncounterId) {
    const encounterRow = queueRows.find((row) => row.id === selectedEncounterId);
    let encounterUnitId: string | null = encounterRow?.clinic_unit_id ?? null;

    if (encounterRow) {
      selectedEncounter = mapQueueRow(encounterRow);
    } else {
      const encounterResult = await supabase
        .from("encounters")
        .select(
          `
          id,
          status,
          checked_in_at,
          clinic_unit_id,
          workers(full_name),
          referrals(occupational_exam_type, companies(legal_name)),
          clinic_units(name),
          encounter_steps(step_type, status, id),
          queue_tickets(priority, status, queue_definitions(name)),
          triage_records(id, status, current_version)
        `,
        )
        .eq("tenant_id", context.tenantId)
        .eq("id", selectedEncounterId)
        .maybeSingle();

      if (encounterResult.error || !encounterResult.data) {
        throw new AppError("VALIDATION_FAILED", "Atendimento não disponível para triagem.", {
          status: 404,
        });
      }

      const parsedEncounter = triageQueueRowSchema.parse(encounterResult.data);
      encounterUnitId = parsedEncounter.clinic_unit_id;
      selectedEncounter = mapQueueRow(parsedEncounter);
    }

    if (!encounterUnitId) {
      throw new AppError("VALIDATION_FAILED", "Atendimento sem unidade vinculada.", {
        status: 404,
      });
    }

    requireUnitPermission(context, encounterUnitId, "clinical.read");

    const recordResult = await supabase
      .from("triage_records")
      .select(
        "id, encounter_id, form_version_id, status, current_version, triage_record_versions(version, payload)",
      )
      .eq("tenant_id", context.tenantId)
      .eq("encounter_id", selectedEncounterId)
      .maybeSingle();

    if (recordResult.error) {
      throw new AppError("INTERNAL_ERROR", "Não foi possível carregar o registro de triagem.", {
        cause: recordResult.error,
        status: 500,
      });
    }

    if (recordResult.data) {
      const record = triageWorkspaceRecordSchema.parse(recordResult.data);
      const latestVersion =
        record.triage_record_versions.find(
          (version) => version.version === record.current_version,
        ) ?? record.triage_record_versions.at(-1);

      if (latestVersion) {
        selectedRecord = {
          currentVersion: record.current_version,
          encounterId: record.encounter_id,
          payload: parseTriageStoredPayload(latestVersion.payload),
          recordId: record.id,
          status: record.status,
        };
      }
    }
  }

  if (!formVersion) {
    return {
      formVersion: { id: "", label: "Nenhum formulário aprovado" },
      professionalName: profileResult.data?.display_name ?? "Profissional",
      queue,
      selectedEncounter,
      selectedRecord,
    };
  }

  return {
    formVersion: {
      id: formVersion.id,
      label: `${formVersion.triage_form_templates?.name ?? "Formulário"} v${formVersion.version}`,
    },
    professionalName: profileResult.data?.display_name ?? "Profissional",
    queue,
    selectedEncounter,
    selectedRecord,
  };
}

export async function saveTriageRecord(input: SaveTriageRecordInput, requestId: string) {
  const parsed = saveTriageRecordSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "triage.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const encounterResult = await supabase
    .from("encounters")
    .select("id, clinic_unit_id, status")
    .eq("tenant_id", context.tenantId)
    .eq("id", parsed.encounterId)
    .maybeSingle();

  if (encounterResult.error || !encounterResult.data) {
    throw new AppError("VALIDATION_FAILED", "Atendimento não encontrado.", { status: 404 });
  }

  requireUnitPermission(context, encounterResult.data.clinic_unit_id, "triage.manage");

  if (["completed", "cancelled"].includes(encounterResult.data.status)) {
    throw new AppError("VALIDATION_FAILED", "Atendimento já encerrado.", { status: 409 });
  }

  const existingRecord = await supabase
    .from("triage_records")
    .select("status")
    .eq("tenant_id", context.tenantId)
    .eq("encounter_id", parsed.encounterId)
    .maybeSingle();

  if (existingRecord.error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível validar a triagem.", {
      cause: existingRecord.error,
      status: 500,
    });
  }

  if (parsed.closeRecord && existingRecord.data?.status === "closed") {
    throw new AppError("VALIDATION_FAILED", "Triagem já concluída.", { status: 409 });
  }

  if (existingRecord.data?.status === "closed" && !parsed.closeRecord) {
    requirePermission(context, "clinical.reopen");
  }

  const profileResult = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", context.userId)
    .maybeSingle();

  const payload: TriageStoredPayload = {
    ...parsed.payload,
    operational: {
      ...parsed.payload.operational,
      completedAt: parsed.closeRecord
        ? new Date().toISOString()
        : parsed.payload.operational.completedAt,
      responsibleProfessionalId: context.userId,
      responsibleProfessionalName: profileResult.data?.display_name ?? "Profissional",
      startedAt: parsed.payload.operational.startedAt ?? new Date().toISOString(),
    },
  };

  const { data, error } = await supabase.rpc("save_triage_record", {
    audit_request_id: requestId,
    change_reason: parsed.reason,
    close_record: parsed.closeRecord,
    payload_value: payload,
    target_encounter_id: parsed.encounterId,
    target_form_version_id: parsed.formVersionId,
    target_tenant_id: context.tenantId,
  });

  if (error) {
    if (error.code === "42501") {
      throw new AppError("PERMISSION_DENIED", "Sem permissão para registrar triagem.", {
        status: 403,
      });
    }
    if (error.message.includes("already closed")) {
      throw new AppError("VALIDATION_FAILED", "Triagem já concluída.", { status: 409 });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a triagem.", {
      cause: error,
      status: 500,
    });
  }

  if (typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a triagem.", { status: 500 });
  }

  return data;
}

export { triageInputFromStored };

export async function closeMedicalConsultation(
  input: CloseMedicalConsultationInput,
  requestId: string,
) {
  const parsed = closeMedicalConsultationSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "consultations.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("close_medical_consultation", {
    assessment_value: parsed.assessment,
    audit_request_id: requestId,
    change_reason: parsed.reason,
    objective_value: parsed.objective,
    physician_credential_id_value: parsed.physicianCredentialId,
    plan_value: parsed.plan,
    subjective_value: parsed.subjective,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível fechar a consulta.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createMedicalConclusion(
  input: CreateMedicalConclusionInput,
  requestId: string,
) {
  const parsed = createMedicalConclusionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requirePermission(context, "conclusions.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_medical_conclusion", {
    audit_request_id: requestId,
    conclusion_code_value: parsed.conclusionCode,
    consultation_id_value: parsed.consultationId,
    notes_value: parsed.notes,
    physician_credential_id_value: parsed.physicianCredentialId,
    restrictions_value: parsed.restrictions,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível preparar a conclusão médica.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
