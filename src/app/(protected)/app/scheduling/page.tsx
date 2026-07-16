import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import {
  appointmentListSchema,
  referralListSchema,
  scheduleResourceListSchema,
} from "@/features/scheduling/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { REFERRAL_COMPANY_EMBED, REFERRAL_WORKER_EMBED, APPOINTMENT_RESOURCE_EMBED } from "@/lib/supabase/embeds";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { SchedulingForms } from "./scheduling-forms";

export default async function SchedulingPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "schedule.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Encaminhamentos e agenda" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [
    unitsResult,
    companiesResult,
    workersResult,
    referralsResult,
    resourcesResult,
    appointmentsResult,
  ] = await Promise.all([
    supabase
      .from("clinic_units")
      .select("id, name")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("companies")
      .select("id, legal_name")
      .eq("tenant_id", context.tenantId)
      .order("legal_name"),
    supabase
      .from("workers")
      .select("id, full_name")
      .eq("tenant_id", context.tenantId)
      .order("full_name"),
    supabase
      .from("referrals")
      .select(
        `id, occupational_exam_type, status, ${REFERRAL_COMPANY_EMBED}(legal_name), ${REFERRAL_WORKER_EMBED}(full_name)`,
      )
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("schedule_resources")
      .select("id, code, name, resource_type, status")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("appointments")
      .select(`id, starts_at, ends_at, status, ${APPOINTMENT_RESOURCE_EMBED}(name)`)
      .eq("tenant_id", context.tenantId)
      .order("starts_at", { ascending: true }),
  ]);

  if (
    unitsResult.error ||
    companiesResult.error ||
    workersResult.error ||
    referralsResult.error ||
    resourcesResult.error ||
    appointmentsResult.error
  ) {
    return (
      <PageLoadError
        title="Encaminhamentos e agenda"
        detail={describeSupabaseFailure(
          [
            unitsResult,
            companiesResult,
            workersResult,
            referralsResult,
            resourcesResult,
            appointmentsResult,
          ],
          "Não foi possível carregar a agenda.",
        )}
      />
    );
  }

  const parsedResources = scheduleResourceListSchema.safeParse(resourcesResult.data);
  const parsedReferrals = referralListSchema.safeParse(referralsResult.data);
  const parsedAppointments = appointmentListSchema.safeParse(appointmentsResult.data);
  if (!parsedResources.success || !parsedReferrals.success || !parsedAppointments.success) {
    return (
      <PageLoadError
        title="Encaminhamentos e agenda"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const resources = parsedResources.data;
  const referrals = parsedReferrals.data;
  const appointments = parsedAppointments.data;

  return (
    <div>
      <PageHeader
        description="Encaminhamento calcula exames pelo protocolo vigente. Agendamento não cria atendimento clínico; conflitos de recurso são bloqueados."
        eyebrow="Recepção e agenda"
        title="Encaminhamentos e agenda"
      />

      <SchedulingForms
        clinicUnits={(unitsResult.data ?? []).map((unit) => ({ id: unit.id, name: unit.name }))}
        companies={(companiesResult.data ?? []).map((company) => ({
          id: company.id,
          name: company.legal_name,
        }))}
        referrals={referrals.map((referral) => ({
          id: referral.id,
          name: `${referral.workers?.full_name ?? "Trabalhador"} · ${referral.occupational_exam_type}`,
        }))}
        resources={resources.map((resource) => ({
          id: resource.id,
          name: `${resource.name} · ${resource.resource_type}`,
        }))}
        workers={(workersResult.data ?? []).map((worker) => ({
          id: worker.id,
          name: worker.full_name,
        }))}
      />

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Encaminhamentos</h2>
          {referrals.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum encaminhamento criado.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {referrals.map((referral) => (
                <li className="py-2.5" key={referral.id}>
                  <span className="font-semibold text-gp-text">
                    {referral.workers?.full_name ?? "Trabalhador"}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {referral.companies?.legal_name ?? "Empresa"} ·{" "}
                    {referral.occupational_exam_type} · {referral.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Agenda</h2>
          {appointments.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum agendamento criado.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {appointments.map((appointment) => (
                <li className="py-2.5" key={appointment.id}>
                  <span className="font-semibold text-gp-text">
                    {new Date(appointment.starts_at).toLocaleString("pt-BR")}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {appointment.schedule_resources?.name ?? "Recurso"} · {appointment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </section>
    </div>
  );
}
