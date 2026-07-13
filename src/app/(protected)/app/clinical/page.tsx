import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  encounterClinicalListSchema,
  physicianCredentialListSchema,
} from "@/features/clinical/schemas";
import { loadTriageWorkspace } from "@/features/clinical/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClinicalForms } from "./clinical-forms";
import { TriageStation } from "./triage-station";

type ClinicalPageProps = {
  searchParams?: Promise<{ encounter?: string }>;
};

export default async function ClinicalPage({ searchParams }: ClinicalPageProps) {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "clinical.read");

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedEncounterId = resolvedSearchParams?.encounter
    ? z.uuid().safeParse(resolvedSearchParams.encounter).data
    : undefined;

  const supabase = await createServerSupabaseClient();
  const [workspace, encountersResult, physiciansResult, consultationsResult] = await Promise.all([
    loadTriageWorkspace(selectedTenantId, selectedEncounterId),
    supabase
      .from("encounters")
      .select("id, status, workers(full_name)")
      .eq("tenant_id", context.tenantId)
      .in("status", ["checked_in", "waiting", "in_progress"]),
    supabase
      .from("clinical_professional_credentials")
      .select(
        "id, professional_role, council_code, council_region, registration_number, user_profiles(display_name)",
      )
      .eq("tenant_id", context.tenantId)
      .eq("professional_role", "physician")
      .eq("status", "active"),
    supabase
      .from("medical_consultations")
      .select("id, encounter_id, status")
      .eq("tenant_id", context.tenantId)
      .eq("status", "closed"),
  ]);

  if (encountersResult.error || physiciansResult.error || consultationsResult.error) {
    throw new Error("Não foi possível carregar a área clínica.");
  }

  const encounters = encounterClinicalListSchema.parse(encountersResult.data);
  const physicians = physicianCredentialListSchema.parse(physiciansResult.data);
  const consultations = (consultationsResult.data ?? []).map((consultation) => ({
    id: consultation.id,
    name: `${consultation.encounter_id} · ${consultation.status}`,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Clínica ocupacional
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Triagem, consulta e conclusão médica</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Dados clínicos são sensíveis, exigem MFA para escrita e ficam separados da recepção e da
          empresa. Alertas são auxiliares; aptidão final continua sendo decisão humana do médico.
        </p>
      </header>

      <TriageStation
        formVersionId={workspace.formVersion.id}
        formVersionLabel={workspace.formVersion.label}
        professionalName={workspace.professionalName}
        queue={workspace.queue}
        selectedEncounter={workspace.selectedEncounter}
        selectedRecord={workspace.selectedRecord}
      />

      <ClinicalForms
        consultations={consultations}
        encounters={encounters.map((encounter) => ({
          id: encounter.id,
          name: `${encounter.workers?.full_name ?? "Trabalhador"} · ${encounter.status}`,
        }))}
        physicians={physicians.map((physician) => ({
          id: physician.id,
          name: `${physician.user_profiles?.display_name ?? "Médico"} · ${
            physician.council_code ?? "registro pendente"
          } ${physician.registration_number ?? ""}`,
        }))}
      />
    </main>
  );
}
