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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Recepção e agenda
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Encaminhamentos e agenda</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Agendamento não cria atendimento clínico. Conflitos de recurso são bloqueados e histórico
          fica preservado.
        </p>
      </header>

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

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Encaminhamentos</h2>
          {referrals.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum encaminhamento criado.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {referrals.map((referral) => (
                <li className="py-3" key={referral.id}>
                  <span className="font-semibold">
                    {referral.workers?.full_name ?? "Trabalhador"}
                  </span>
                  <span className="ml-2 text-slate-600">
                    {referral.companies?.legal_name ?? "Empresa"} ·{" "}
                    {referral.occupational_exam_type} · {referral.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Agenda</h2>
          {appointments.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum agendamento criado.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {appointments.map((appointment) => (
                <li className="py-3" key={appointment.id}>
                  <span className="font-semibold">
                    {new Date(appointment.starts_at).toLocaleString("pt-BR")}
                  </span>
                  <span className="ml-2 text-slate-600">
                    {appointment.schedule_resources?.name ?? "Recurso"} · {appointment.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
