import "server-only";

import {
  requireAal2,
  requireTenantOrUnitPermission,
  requireUnitPermission,
  hasTenantOrUnitPermission,
} from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { AppError } from "@/core/errors/app-error";
import { recordSensitiveRead } from "@/features/audit/sensitive-read";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  approvedTriageFormVersionSchema,
  closeMedicalConsultationSchema,
  consultationQueueListSchema,
  consultationQueueRowSchema,
  consultationWorkspaceRecordSchema,
  conclusionQueueListSchema,
  conclusionQueueRowSchema,
  conclusionWorkspaceRecordSchema,
  createMedicalConclusionSchema,
  physicianCredentialListSchema,
  saveTriageRecordSchema,
  triageQueueListSchema,
  triageQueueRowSchema,
  triageWorkspaceRecordSchema,
  type CloseMedicalConsultationInput,
  type CreateMedicalConclusionInput,
  type SaveMedicalConsultationInput,
  type SaveTriageRecordInput,
  createClinicalAlertSchema,
  acknowledgeClinicalAlertSchema,
  createConsultationAddendumSchema,
  pauseEncounterFlowSchema,
  resolveEncounterFlowPauseSchema,
  type CreateClinicalAlertInput,
  type AcknowledgeClinicalAlertInput,
  type CreateConsultationAddendumInput,
  type PauseEncounterFlowInput,
  type ResolveEncounterFlowPauseInput,
} from "./schemas";
import { buildConclusionBlockers, countPendingRequiredExams } from "./conclusion-payload";
import {
  consultationInputFromStored,
  parseConsultationVersionPayload,
  type ConsultationStoredPayload,
} from "./consultation-payload";
import {
  formatWaitDuration,
  occupationalExamTypeLabels,
  parseTriageStoredPayload,
  triageInputFromStored,
  type TriageStoredPayload,
} from "./triage-payload";
import { type ConclusionBlocker, type ConclusionCode } from "./workflow";

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

export type ConsultationQueueItem = {
  checkedInAt: string;
  clinicUnitName: string;
  companyName: string;
  consultationId: string | null;
  consultationStatus: string | null;
  encounterId: string;
  examTypeLabel: string;
  pendingExams: number;
  priority: number | null;
  queueName: string | null;
  status: string;
  stepStatus: string;
  triageSummary: TriageStoredPayload | null;
  waitLabel: string;
  workerName: string;
};

export type PhysicianOption = {
  id: string;
  label: string;
};

export type ConsultationWorkspace = {
  physicians: readonly PhysicianOption[];
  professionalName: string;
  queue: readonly ConsultationQueueItem[];
  selectedEncounter: ConsultationQueueItem | null;
  selectedRecord: {
    consultationId: string;
    currentVersion: number;
    encounterId: string;
    payload: ConsultationStoredPayload;
    physicianCredentialId: string;
    status: string;
  } | null;
};

export type ConclusionQueueItem = {
  blockers: readonly ConclusionBlocker[];
  checkedInAt: string;
  clinicUnitName: string;
  companyName: string;
  consultationId: string | null;
  consultationSummary: { assessment: string | null; plan: string | null } | null;
  encounterId: string;
  examTypeLabel: string;
  hasConclusion: boolean;
  pendingExams: number;
  priority: number | null;
  queueName: string | null;
  status: string;
  waitLabel: string;
  workerName: string;
};

export type ConclusionWorkspace = {
  billingDefaults: {
    companyId: string | null;
    contractId: string | null;
    priceTableId: string | null;
    templateVersionId: string | null;
  };
  encounterVersion: number | null;
  physicians: readonly PhysicianOption[];
  professionalName: string;
  queue: readonly ConclusionQueueItem[];
  selectedEncounter: ConclusionQueueItem | null;
  selectedRecord: {
    conclusionCode: ConclusionCode;
    conclusionId: string;
    conclusionVersion: number;
    encounterId: string;
    notes: string | null;
    physicianCredentialId: string;
    restrictions: readonly string[];
    signatureStatus: string;
  } | null;
};

function parseRestrictionsValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

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
  requireTenantOrUnitPermission(context, "clinical.read");

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
            workers!encounters_worker_tenant_fk(full_name),
            referrals(occupational_exam_type, companies!referrals_company_tenant_fk(legal_name)),
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
          workers!encounters_worker_tenant_fk(full_name),
          referrals(occupational_exam_type, companies!referrals_company_tenant_fk(legal_name)),
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
  requireTenantOrUnitPermission(context, "triage.manage");
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
    requireUnitPermission(context, encounterResult.data.clinic_unit_id, "clinical.reopen");
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

  if (parsed.closeRecord) {
    const { completeEncounterStepByType } = await import("@/features/encounters/complete-step");
    await completeEncounterStepByType({
      encounterId: parsed.encounterId,
      requestId,
      stepType: "reception",
      tenantId: context.tenantId,
    });
    await completeEncounterStepByType({
      encounterId: parsed.encounterId,
      requestId,
      stepType: "triage",
      tenantId: context.tenantId,
    });
  }

  return data;
}

function mapConsultationQueueRow(
  row: (typeof consultationQueueListSchema)["_output"][number],
  now = Date.now(),
): ConsultationQueueItem {
  const consultStep = row.encounter_steps.find((step) => step.step_type === "consultation");
  const ticket = row.queue_tickets[0];
  const consultation = row.medical_consultations[0];

  return {
    checkedInAt: row.checked_in_at,
    clinicUnitName: row.clinic_units?.name ?? "Unidade",
    companyName: row.referrals?.companies?.legal_name ?? "Empresa não informada",
    consultationId: consultation?.id ?? null,
    consultationStatus: consultation?.status ?? null,
    encounterId: row.id,
    examTypeLabel:
      occupationalExamTypeLabels[row.referrals?.occupational_exam_type ?? ""] ??
      row.referrals?.occupational_exam_type ??
      "Exame ocupacional",
    pendingExams: row.exam_orders.filter(
      (order) => !["resulted", "cancelled"].includes(order.status),
    ).length,
    priority: ticket?.priority ?? null,
    queueName: ticket?.queue_definitions?.name ?? null,
    status: row.status,
    stepStatus: consultStep?.status ?? "pending",
    triageSummary: null,
    waitLabel: formatWaitDuration(row.checked_in_at, now),
    workerName: row.workers?.full_name ?? "Trabalhador",
  };
}

export async function loadConsultationWorkspace(
  tenantId: string,
  selectedEncounterId?: string,
  requestId?: string,
): Promise<ConsultationWorkspace> {
  const context = await resolveAuthorizationContext(tenantId);
  requireTenantOrUnitPermission(context, "clinical.read");

  const unitIds = Array.from(context.clinicUnitIds);
  const supabase = await createServerSupabaseClient();

  const [profileResult, physiciansResult, queueResult] = await Promise.all([
    supabase.from("user_profiles").select("display_name").eq("id", context.userId).maybeSingle(),
    supabase
      .from("clinical_professional_credentials")
      .select(
        "id, council_code, council_region, professional_role, registration_number, user_id, user_profiles(display_name)",
      )
      .eq("tenant_id", context.tenantId)
      .eq("professional_role", "physician")
      .eq("status", "active"),
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
            workers!encounters_worker_tenant_fk(full_name),
            referrals(occupational_exam_type, companies!referrals_company_tenant_fk(legal_name)),
            clinic_units(name),
            encounter_steps(step_type, status, id),
            queue_tickets(priority, status, queue_definitions(name)),
            triage_records(id, status, current_version, triage_record_versions(version, payload)),
            medical_consultations(id, status, current_version, physician_credential_id),
            exam_orders(id, status, exam_catalog!exam_orders_exam_catalog_tenant_fk(name))
          `,
          )
          .eq("tenant_id", context.tenantId)
          .in("clinic_unit_id", unitIds)
          .in("status", ["checked_in", "waiting", "in_progress"])
          .order("checked_in_at"),
  ]);

  if (profileResult.error || physiciansResult.error || queueResult.error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a estação de consulta.", {
      cause: profileResult.error ?? physiciansResult.error ?? queueResult.error,
      status: 500,
    });
  }

  const physicianRows = physicianCredentialListSchema.parse(physiciansResult.data ?? []);
  const physicians: PhysicianOption[] = physicianRows
    .filter((row) => row.user_id === context.userId)
    .map((row) => ({
      id: row.id,
      label: `${row.user_profiles?.display_name ?? "Médico"} · ${row.council_code ?? "CRM"} ${row.registration_number ?? ""}`,
    }));

  const queueRows = consultationQueueListSchema.parse(queueResult.data ?? []);
  const queue = queueRows
    .filter((row) => {
      const consultStep = row.encounter_steps.find((step) => step.step_type === "consultation");
      const triageRecord = row.triage_records[0];
      const consultation = row.medical_consultations[0];
      if (!consultStep || triageRecord?.status !== "closed") return false;
      if (consultation?.status === "closed") return false;
      return ["available", "in_progress", "pending"].includes(consultStep.status);
    })
    .map((row) => {
      const item = mapConsultationQueueRow(row);
      const triageRecord = row.triage_records[0];
      const latestTriageVersion = triageRecord?.triage_record_versions?.find(
        (version) => version.version === triageRecord.current_version,
      );
      if (latestTriageVersion) {
        item.triageSummary = parseTriageStoredPayload(latestTriageVersion.payload);
      }
      return item;
    })
    .sort((left, right) => {
      const leftPriority = left.priority ?? 999;
      const rightPriority = right.priority ?? 999;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return new Date(left.checkedInAt).getTime() - new Date(right.checkedInAt).getTime();
    });

  let selectedRecord: ConsultationWorkspace["selectedRecord"] = null;
  let selectedEncounter: ConsultationQueueItem | null = null;

  if (selectedEncounterId) {
    const encounterRow = queueRows.find((row) => row.id === selectedEncounterId);
    let encounterUnitId: string | null = encounterRow?.clinic_unit_id ?? null;

    if (encounterRow) {
      selectedEncounter = mapConsultationQueueRow(encounterRow);
      const latestTriageVersion = encounterRow.triage_records[0]?.triage_record_versions?.find(
        (version) => version.version === encounterRow.triage_records[0]?.current_version,
      );
      if (latestTriageVersion) {
        selectedEncounter.triageSummary = parseTriageStoredPayload(latestTriageVersion.payload);
      }
    } else {
      const encounterResult = await supabase
        .from("encounters")
        .select(
          `
          id,
          status,
          checked_in_at,
          clinic_unit_id,
          workers!encounters_worker_tenant_fk(full_name),
          referrals(occupational_exam_type, companies!referrals_company_tenant_fk(legal_name)),
          clinic_units(name),
          encounter_steps(step_type, status, id),
          queue_tickets(priority, status, queue_definitions(name)),
          triage_records(id, status, current_version, triage_record_versions(version, payload)),
          medical_consultations(id, status, current_version, physician_credential_id),
          exam_orders(id, status, exam_catalog!exam_orders_exam_catalog_tenant_fk(name))
        `,
        )
        .eq("tenant_id", context.tenantId)
        .eq("id", selectedEncounterId)
        .maybeSingle();

      if (encounterResult.error || !encounterResult.data) {
        throw new AppError("VALIDATION_FAILED", "Atendimento não disponível para consulta.", {
          status: 404,
        });
      }

      const parsedEncounter = consultationQueueRowSchema.parse(encounterResult.data);
      encounterUnitId = parsedEncounter.clinic_unit_id;
      selectedEncounter = mapConsultationQueueRow(parsedEncounter);
      const latestTriageVersion = parsedEncounter.triage_records[0]?.triage_record_versions?.find(
        (version) => version.version === parsedEncounter.triage_records[0]?.current_version,
      );
      if (latestTriageVersion) {
        selectedEncounter.triageSummary = parseTriageStoredPayload(latestTriageVersion.payload);
      }
    }

    if (!encounterUnitId) {
      throw new AppError("VALIDATION_FAILED", "Atendimento sem unidade vinculada.", {
        status: 404,
      });
    }

    requireUnitPermission(context, encounterUnitId, "clinical.read");

    const recordResult = await supabase
      .from("medical_consultations")
      .select(
        "id, encounter_id, physician_credential_id, status, current_version, medical_consultation_versions(version, subjective, objective, assessment, plan)",
      )
      .eq("tenant_id", context.tenantId)
      .eq("encounter_id", selectedEncounterId)
      .maybeSingle();

    if (recordResult.error) {
      throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a consulta.", {
        cause: recordResult.error,
        status: 500,
      });
    }

    if (recordResult.data) {
      const record = consultationWorkspaceRecordSchema.parse(recordResult.data);
      const latestVersion =
        record.medical_consultation_versions.find(
          (version) => version.version === record.current_version,
        ) ?? record.medical_consultation_versions.at(-1);

      if (latestVersion) {
        selectedRecord = {
          consultationId: record.id,
          currentVersion: record.current_version,
          encounterId: record.encounter_id,
          payload: parseConsultationVersionPayload(
            latestVersion.subjective,
            latestVersion.objective,
            latestVersion.assessment,
            latestVersion.plan,
          ),
          physicianCredentialId: record.physician_credential_id,
          status: record.status,
        };
      }
    }
  }

  if (selectedEncounterId && requestId) {
    await recordSensitiveRead({
      action: "chart.viewed",
      entityId: selectedEncounterId,
      entityType: "encounter",
      requestId,
      tenantId: context.tenantId,
    });
  }

  return {
    physicians,
    professionalName: profileResult.data?.display_name ?? "Profissional",
    queue,
    selectedEncounter,
    selectedRecord,
  };
}

function mapConclusionQueueRow(
  row: (typeof conclusionQueueListSchema)["_output"][number],
  physicianCredential: {
    councilCode: string | null;
    councilRegion: string | null;
    registrationNumber: string | null;
  } | null,
  now = Date.now(),
): ConclusionQueueItem {
  const ticket = row.queue_tickets[0];
  const consultation = row.medical_consultations[0];
  const triageRecord = row.triage_records[0];
  const conclusion = row.medical_conclusions[0];
  const pendingExams = countPendingRequiredExams(row.exam_orders);
  const flowPaused = row.encounter_flow_pauses.some((pause) => pause.status === "active");

  return {
    blockers: buildConclusionBlockers({
      consultationStatus: consultation?.status ?? null,
      flowPaused,
      pendingRequiredExams: pendingExams,
      physicianCredential,
      triageStatus: triageRecord?.status ?? null,
    }),
    checkedInAt: row.checked_in_at,
    clinicUnitName: row.clinic_units?.name ?? "Unidade",
    companyName: row.referrals?.companies?.legal_name ?? "Empresa não informada",
    consultationId: consultation?.id ?? null,
    consultationSummary: null,
    encounterId: row.id,
    examTypeLabel:
      occupationalExamTypeLabels[row.referrals?.occupational_exam_type ?? ""] ??
      row.referrals?.occupational_exam_type ??
      "Exame ocupacional",
    hasConclusion: Boolean(conclusion),
    pendingExams,
    priority: ticket?.priority ?? null,
    queueName: ticket?.queue_definitions?.name ?? null,
    status: row.status,
    waitLabel: formatWaitDuration(row.checked_in_at, now),
    workerName: row.workers?.full_name ?? "Trabalhador",
  };
}

export async function loadConclusionWorkspace(
  tenantId: string,
  selectedEncounterId?: string,
): Promise<ConclusionWorkspace> {
  const context = await resolveAuthorizationContext(tenantId);
  requireTenantOrUnitPermission(context, "clinical.read");

  const unitIds = Array.from(context.clinicUnitIds);
  const supabase = await createServerSupabaseClient();

  const [profileResult, physiciansResult, queueResult] = await Promise.all([
    supabase.from("user_profiles").select("display_name").eq("id", context.userId).maybeSingle(),
    supabase
      .from("clinical_professional_credentials")
      .select(
        "id, council_code, council_region, professional_role, registration_number, user_id, user_profiles(display_name)",
      )
      .eq("tenant_id", context.tenantId)
      .eq("professional_role", "physician")
      .eq("status", "active"),
    unitIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("encounters")
          .select(
            `
            id,
            status,
            version,
            checked_in_at,
            clinic_unit_id,
            workers!encounters_worker_tenant_fk(full_name),
            referrals(occupational_exam_type, company_id, companies!referrals_company_tenant_fk(legal_name)),
            clinic_units(name),
            encounter_steps(step_type, status, id),
            queue_tickets(priority, status, queue_definitions(name)),
            triage_records(id, status, current_version),
            medical_consultations(
              id,
              status,
              current_version,
              physician_credential_id,
              medical_consultation_versions(version, assessment, plan)
            ),
            exam_orders(id, status, exam_catalog!exam_orders_exam_catalog_tenant_fk(name)),
            encounter_flow_pauses(id, status),
            medical_conclusions(
              id,
              conclusion_code,
              physician_credential_id,
              restrictions,
              notes,
              signature_status,
              version
            )
          `,
          )
          .eq("tenant_id", context.tenantId)
          .in("clinic_unit_id", unitIds)
          .in("status", ["checked_in", "waiting", "in_progress", "completed"])
          .order("checked_in_at"),
  ]);

  if (profileResult.error || physiciansResult.error || queueResult.error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a estação de conclusão.", {
      cause: profileResult.error ?? physiciansResult.error ?? queueResult.error,
      status: 500,
    });
  }

  const physicianRows = physicianCredentialListSchema.parse(physiciansResult.data ?? []);
  const userPhysician = physicianRows.find((row) => row.user_id === context.userId) ?? null;
  const physicianCredential = userPhysician
    ? {
        councilCode: userPhysician.council_code,
        councilRegion: userPhysician.council_region,
        registrationNumber: userPhysician.registration_number,
      }
    : null;

  const physicians: PhysicianOption[] = physicianRows
    .filter((row) => row.user_id === context.userId)
    .map((row) => ({
      id: row.id,
      label: `${row.user_profiles?.display_name ?? "Médico"} · ${row.council_code ?? "CRM"} ${row.registration_number ?? ""}`,
    }));

  const queueRows = conclusionQueueListSchema.parse(queueResult.data ?? []);
  const queue = queueRows
    .filter((row) => {
      const consultation = row.medical_consultations[0];
      const conclusion = row.medical_conclusions[0];
      if (consultation?.status !== "closed") return false;
      if (!conclusion) return true;
      return ["prepared", "draft", "pending_signature"].includes(conclusion.signature_status);
    })
    .map((row) => mapConclusionQueueRow(row, physicianCredential))
    .sort((left, right) => {
      const leftPriority = left.priority ?? 999;
      const rightPriority = right.priority ?? 999;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return new Date(left.checkedInAt).getTime() - new Date(right.checkedInAt).getTime();
    });

  let selectedRecord: ConclusionWorkspace["selectedRecord"] = null;
  let selectedEncounter: ConclusionQueueItem | null = null;
  let encounterVersion: number | null = null;
  let companyId: string | null = null;

  if (selectedEncounterId) {
    const encounterRow = queueRows.find((row) => row.id === selectedEncounterId);
    let encounterUnitId: string | null = encounterRow?.clinic_unit_id ?? null;

    if (encounterRow) {
      selectedEncounter = mapConclusionQueueRow(encounterRow, physicianCredential);
      encounterVersion = encounterRow.version ?? 1;
      companyId = encounterRow.referrals?.company_id ?? null;
      const consultation = encounterRow.medical_consultations[0];
      const latestVersion = consultation?.medical_consultation_versions?.find(
        (version) => version.version === consultation.current_version,
      );
      if (latestVersion) {
        selectedEncounter.consultationSummary = {
          assessment: latestVersion.assessment,
          plan: latestVersion.plan,
        };
      }
    } else {
      const encounterResult = await supabase
        .from("encounters")
        .select(
          `
          id,
          status,
          version,
          checked_in_at,
          clinic_unit_id,
          workers!encounters_worker_tenant_fk(full_name),
          referrals(occupational_exam_type, company_id, companies!referrals_company_tenant_fk(legal_name)),
          clinic_units(name),
          encounter_steps(step_type, status, id),
          queue_tickets(priority, status, queue_definitions(name)),
          triage_records(id, status, current_version),
          medical_consultations(
            id,
            status,
            current_version,
            physician_credential_id,
            medical_consultation_versions(version, assessment, plan)
          ),
          exam_orders(id, status, exam_catalog!exam_orders_exam_catalog_tenant_fk(name)),
          encounter_flow_pauses(id, status),
          medical_conclusions(
            id,
            conclusion_code,
            physician_credential_id,
            restrictions,
            notes,
            signature_status,
            version
          )
        `,
        )
        .eq("tenant_id", context.tenantId)
        .eq("id", selectedEncounterId)
        .maybeSingle();

      if (encounterResult.error || !encounterResult.data) {
        throw new AppError("VALIDATION_FAILED", "Atendimento não disponível para conclusão.", {
          status: 404,
        });
      }

      const parsedEncounter = conclusionQueueRowSchema.parse(encounterResult.data);
      encounterUnitId = parsedEncounter.clinic_unit_id;
      encounterVersion = parsedEncounter.version ?? 1;
      companyId = parsedEncounter.referrals?.company_id ?? null;
      selectedEncounter = mapConclusionQueueRow(parsedEncounter, physicianCredential);
      const consultation = parsedEncounter.medical_consultations[0];
      const latestVersion = consultation?.medical_consultation_versions?.find(
        (version) => version.version === consultation.current_version,
      );
      if (latestVersion) {
        selectedEncounter.consultationSummary = {
          assessment: latestVersion.assessment,
          plan: latestVersion.plan,
        };
      }
    }

    if (!encounterUnitId) {
      throw new AppError("VALIDATION_FAILED", "Atendimento sem unidade vinculada.", {
        status: 404,
      });
    }

    requireUnitPermission(context, encounterUnitId, "clinical.read");

    const conclusionResult = await supabase
      .from("medical_conclusions")
      .select(
        "id, encounter_id, physician_credential_id, conclusion_code, restrictions, notes, signature_status, version",
      )
      .eq("tenant_id", context.tenantId)
      .eq("encounter_id", selectedEncounterId)
      .maybeSingle();

    if (conclusionResult.error) {
      throw new AppError("INTERNAL_ERROR", "Não foi possível carregar a conclusão.", {
        cause: conclusionResult.error,
        status: 500,
      });
    }

    if (conclusionResult.data) {
      const record = conclusionWorkspaceRecordSchema.parse(conclusionResult.data);
      selectedRecord = {
        conclusionCode: record.conclusion_code as ConclusionCode,
        conclusionId: record.id,
        conclusionVersion: record.version,
        encounterId: record.encounter_id,
        notes: record.notes,
        physicianCredentialId: record.physician_credential_id,
        restrictions: parseRestrictionsValue(record.restrictions),
        signatureStatus: record.signature_status,
      };
    }
  }

  const [contractResult, priceTableResult, templateResult] = await Promise.all([
    companyId
      ? supabase
          .from("commercial_contracts")
          .select("id")
          .eq("tenant_id", context.tenantId)
          .eq("company_id", companyId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    companyId
      ? supabase
          .from("commercial_price_tables")
          .select("id, status, contract_id")
          .eq("tenant_id", context.tenantId)
          .in("status", ["approved", "active"])
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("document_template_versions")
      .select("id, template_id, status")
      .eq("tenant_id", context.tenantId)
      .eq("status", "approved")
      .order("version", { ascending: false })
      .limit(20),
  ]);

  let templateVersionId: string | null = null;
  if (templateResult.data?.length) {
    const templateIds = templateResult.data.map((row) => row.template_id);
    const { data: asoTemplates } = await supabase
      .from("document_templates")
      .select("id")
      .eq("tenant_id", context.tenantId)
      .eq("document_type", "aso")
      .in("id", templateIds);
    const asoId = new Set((asoTemplates ?? []).map((row) => row.id));
    templateVersionId =
      templateResult.data.find((row) => asoId.has(row.template_id))?.id ?? null;
  }

  const contractId = contractResult.data?.id ?? null;
  const priceTableId =
    (priceTableResult.data ?? []).find((row) => row.contract_id === contractId)?.id ??
    (priceTableResult.data ?? [])[0]?.id ??
    null;

  return {
    billingDefaults: {
      companyId,
      contractId,
      priceTableId,
      templateVersionId,
    },
    encounterVersion,
    physicians,
    professionalName: profileResult.data?.display_name ?? "Profissional",
    queue,
    selectedEncounter,
    selectedRecord,
  };
}

export async function saveMedicalConsultation(
  input: SaveMedicalConsultationInput,
  requestId: string,
) {
  const parsed = closeMedicalConsultationSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "consultations.manage");
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

  requireUnitPermission(context, encounterResult.data.clinic_unit_id, "consultations.manage");

  if (["completed", "cancelled"].includes(encounterResult.data.status)) {
    throw new AppError("VALIDATION_FAILED", "Atendimento já encerrado.", { status: 409 });
  }

  const triageResult = await supabase
    .from("triage_records")
    .select("status")
    .eq("tenant_id", context.tenantId)
    .eq("encounter_id", parsed.encounterId)
    .maybeSingle();

  if (triageResult.error || triageResult.data?.status !== "closed") {
    throw new AppError("VALIDATION_FAILED", "Conclua a triagem antes da consulta.", {
      status: 409,
    });
  }

  const existingConsultation = await supabase
    .from("medical_consultations")
    .select("status")
    .eq("tenant_id", context.tenantId)
    .eq("encounter_id", parsed.encounterId)
    .maybeSingle();

  if (existingConsultation.error) {
    throw new AppError("INTERNAL_ERROR", "Não foi possível validar a consulta.", {
      cause: existingConsultation.error,
      status: 500,
    });
  }

  if (parsed.closeRecord && existingConsultation.data?.status === "closed") {
    throw new AppError("VALIDATION_FAILED", "Consulta já concluída.", { status: 409 });
  }

  if (existingConsultation.data?.status === "closed" && !parsed.closeRecord) {
    requireUnitPermission(context, encounterResult.data.clinic_unit_id, "clinical.reopen");
  }

  const credentialResult = await supabase
    .from("clinical_professional_credentials")
    .select("id")
    .eq("tenant_id", context.tenantId)
    .eq("id", parsed.physicianCredentialId)
    .eq("user_id", context.userId)
    .eq("professional_role", "physician")
    .eq("status", "active")
    .maybeSingle();

  if (credentialResult.error || !credentialResult.data) {
    throw new AppError("VALIDATION_FAILED", "Credencial médica inválida para este usuário.", {
      status: 403,
    });
  }

  const { data, error } = await supabase.rpc("save_medical_consultation", {
    assessment_value: parsed.assessment,
    audit_request_id: requestId,
    change_reason: parsed.reason,
    close_record: parsed.closeRecord,
    objective_value: parsed.objective,
    physician_credential_id_value: parsed.physicianCredentialId,
    plan_value: parsed.plan,
    subjective_value: parsed.subjective,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error) {
    if (error.code === "42501") {
      throw new AppError("PERMISSION_DENIED", "Sem permissão para registrar consulta.", {
        status: 403,
      });
    }
    if (error.message.includes("already closed")) {
      throw new AppError("VALIDATION_FAILED", "Consulta já concluída.", { status: 409 });
    }
    if (error.message.includes("triage not completed")) {
      throw new AppError("VALIDATION_FAILED", "Conclua a triagem antes da consulta.", {
        status: 409,
      });
    }
    if (error.message.includes("professional registration missing")) {
      throw new AppError(
        "VALIDATION_FAILED",
        "Registro profissional incompleto para fechar a consulta.",
        { status: 409 },
      );
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a consulta.", {
      cause: error,
      status: 500,
    });
  }

  if (typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível salvar a consulta.", { status: 500 });
  }

  if (parsed.closeRecord) {
    const { completeEncounterStepByType } = await import("@/features/encounters/complete-step");
    await completeEncounterStepByType({
      encounterId: parsed.encounterId,
      requestId,
      stepType: "consultation",
      tenantId: context.tenantId,
    });
  }

  return data;
}

export { consultationInputFromStored, triageInputFromStored };

export async function closeMedicalConsultation(
  input: CloseMedicalConsultationInput,
  requestId: string,
) {
  return saveMedicalConsultation(
    {
      closeRecord: true,
      encounterId: input.encounterId,
      input: {
        assessment: input.assessment ?? "",
        objective: {
          generalAppearance: null,
          physicalExam:
            typeof input.objective.exameFisico === "string"
              ? input.objective.exameFisico
              : JSON.stringify(input.objective),
          vitalSignsReview: null,
        },
        plan: input.plan ?? "",
        subjective: {
          chiefComplaint:
            typeof input.subjective.queixa === "string"
              ? input.subjective.queixa
              : JSON.stringify(input.subjective),
          historyOfPresentIllness: null,
          occupationalHistory: null,
          reviewOfSystems: null,
        },
      },
      physicianCredentialId: input.physicianCredentialId,
      reason: input.reason,
      tenantId: input.tenantId,
    },
    requestId,
  );
}

export async function createMedicalConclusion(
  input: CreateMedicalConclusionInput,
  requestId: string,
) {
  const parsed = createMedicalConclusionSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "conclusions.manage");
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

  requireUnitPermission(context, encounterResult.data.clinic_unit_id, "conclusions.manage");

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
    if (error?.code === "42501") {
      throw new AppError("PERMISSION_DENIED", "Sem permissão para registrar conclusão.", {
        status: 403,
      });
    }
    if (error?.message.includes("physician credential missing")) {
      throw new AppError("VALIDATION_FAILED", "Credencial médica inválida para este usuário.", {
        status: 403,
      });
    }
    if (error?.message.includes("professional registration missing")) {
      throw new AppError(
        "VALIDATION_FAILED",
        "Registro profissional incompleto para emitir conclusão.",
        { status: 409 },
      );
    }
    if (error?.message.includes("closed triage required")) {
      throw new AppError("VALIDATION_FAILED", "Conclua a triagem antes da conclusão.", {
        status: 409,
      });
    }
    if (error?.message.includes("closed consultation required")) {
      throw new AppError("VALIDATION_FAILED", "Conclua a consulta antes da conclusão.", {
        status: 409,
      });
    }
    if (error?.message.includes("required exams pending")) {
      throw new AppError("VALIDATION_FAILED", "Existem exames obrigatórios pendentes.", {
        status: 409,
      });
    }
    if (error?.message.includes("encounter flow paused")) {
      throw new AppError("VALIDATION_FAILED", "Fluxo clínico pausado por intercorrência.", {
        status: 409,
      });
    }
    throw new AppError("INTERNAL_ERROR", "Não foi possível preparar a conclusão médica.", {
      cause: error,
      status: 500,
    });
  }

  const { completeEncounterStepByType } = await import("@/features/encounters/complete-step");
  await completeEncounterStepByType({
    encounterId: parsed.encounterId,
    requestId,
    stepType: "conclusion",
    tenantId: context.tenantId,
  });

  return data;
}

function requireClinicalFlowPermission(context: Parameters<typeof hasTenantOrUnitPermission>[0]) {
  if (
    !hasTenantOrUnitPermission(context, "triage.manage") &&
    !hasTenantOrUnitPermission(context, "consultations.manage")
  ) {
    throw new AppError("PERMISSION_DENIED", "Sem permissão clínica para esta operação.", {
      status: 403,
    });
  }
}

export async function createClinicalAlert(input: CreateClinicalAlertInput, requestId: string) {
  const parsed = createClinicalAlertSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireClinicalFlowPermission(context);
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_clinical_alert", {
    audit_request_id: requestId,
    message_value: parsed.message,
    severity_value: parsed.severity,
    source_type_value: parsed.sourceType,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível criar alerta clínico.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function acknowledgeClinicalAlert(
  input: AcknowledgeClinicalAlertInput,
  requestId: string,
) {
  const parsed = acknowledgeClinicalAlertSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireClinicalFlowPermission(context);
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("acknowledge_clinical_alert", {
    audit_request_id: requestId,
    note_value: parsed.note,
    target_alert_id: parsed.alertId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível reconhecer alerta.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function createConsultationAddendum(
  input: CreateConsultationAddendumInput,
  requestId: string,
) {
  const parsed = createConsultationAddendumSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireTenantOrUnitPermission(context, "consultations.manage");
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_consultation_addendum", {
    audit_request_id: requestId,
    note_value: parsed.note,
    reason_value: parsed.reason,
    target_consultation_id: parsed.consultationId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível registrar adendo.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function pauseEncounterFlow(input: PauseEncounterFlowInput, requestId: string) {
  const parsed = pauseEncounterFlowSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireClinicalFlowPermission(context);
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("pause_encounter_flow", {
    audit_request_id: requestId,
    reason_value: parsed.reason,
    target_encounter_id: parsed.encounterId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível pausar o fluxo.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}

export async function resolveEncounterFlowPause(
  input: ResolveEncounterFlowPauseInput,
  requestId: string,
) {
  const parsed = resolveEncounterFlowPauseSchema.parse(input);
  const context = await resolveAuthorizationContext(parsed.tenantId);
  requireClinicalFlowPermission(context);
  requireAal2(context);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("resolve_encounter_flow_pause", {
    audit_request_id: requestId,
    resolved_note_value: parsed.resolvedNote,
    target_pause_id: parsed.pauseId,
    target_tenant_id: context.tenantId,
  });

  if (error || typeof data !== "string") {
    throw new AppError("INTERNAL_ERROR", "Não foi possível retomar o fluxo.", {
      cause: error,
      status: 500,
    });
  }

  return data;
}
