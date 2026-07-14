import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import {
  appointmentListSchema,
  referralListSchema,
  scheduleResourceListSchema,
} from "@/features/scheduling/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { SchedulingForms } from "./scheduling-forms";

export default async function SchedulingPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "schedule.read");

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
      .select("id, occupational_exam_type, status, companies(legal_name), workers(full_name)")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("schedule_resources")
      .select("id, code, name, resource_type, status")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, schedule_resources(name)")
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
    throw new Error("Não foi possível carregar a agenda.");
  }

  const resources = scheduleResourceListSchema.parse(resourcesResult.data);
  const referrals = referralListSchema.parse(referralsResult.data);
  const appointments = appointmentListSchema.parse(appointmentsResult.data);

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
