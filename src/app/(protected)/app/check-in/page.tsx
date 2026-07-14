import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTenantOrUnitPermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { encounterListSchema, queueTicketListSchema } from "@/features/encounters/schemas";
import { appointmentListSchema } from "@/features/scheduling/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CheckInForm } from "./check-in-form";

export default async function CheckInPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requireTenantOrUnitPermission(context, "encounters.read");

  const supabase = await createServerSupabaseClient();
  const [appointmentsResult, encountersResult, queueResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, starts_at, ends_at, status, schedule_resources(name)")
      .eq("tenant_id", context.tenantId)
      .in("status", ["scheduled", "confirmed"])
      .order("starts_at"),
    supabase
      .from("encounters")
      .select("id, status, checked_in_at, workers(full_name), exam_orders(id)")
      .eq("tenant_id", context.tenantId)
      .order("checked_in_at", { ascending: false }),
    supabase
      .from("queue_tickets")
      .select(
        "id, status, priority, created_at, queue_definitions(name), encounters(workers(full_name))",
      )
      .eq("tenant_id", context.tenantId)
      .order("priority")
      .order("created_at"),
  ]);

  if (appointmentsResult.error || encountersResult.error || queueResult.error) {
    throw new Error("Não foi possível carregar check-in e filas.");
  }

  const appointments = appointmentListSchema.parse(appointmentsResult.data);
  const encounters = encounterListSchema.parse(encountersResult.data);
  const tickets = queueTicketListSchema.parse(queueResult.data);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Check-in e filas
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Check-in transacional</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          O check-in cria atendimento, snapshot com preview do protocolo, etapas (recepção → triagem
          → exame → consulta → documento), pedidos a partir do encaminhamento, filas, auditoria e
          outbox em uma única transação (AAL2).
        </p>
      </header>

      <CheckInForm
        appointments={appointments.map((appointment) => ({
          id: appointment.id,
          label: `${new Date(appointment.starts_at).toLocaleString("pt-BR")} · ${
            appointment.schedule_resources?.name ?? "Recurso"
          }`,
        }))}
      />

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Atendimentos</h2>
          {encounters.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum atendimento em aberto.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {encounters.map((encounter) => {
                const examCount = encounter.exam_orders?.length ?? 0;
                return (
                  <li className="py-3" key={encounter.id}>
                    <span className="font-semibold">
                      {encounter.workers?.full_name ?? "Trabalhador"}
                    </span>
                    <span className="ml-2 text-slate-600">
                      {encounter.status}
                      {examCount > 0 ? ` · ${examCount} pedido(s) de exame` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Fila</h2>
          {tickets.length === 0 ? (
            <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
              Nenhum ticket aguardando.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-200 text-sm">
              {tickets.map((ticket) => (
                <li className="py-3" key={ticket.id}>
                  <span className="font-semibold">
                    {ticket.encounters?.workers?.full_name ?? "Trabalhador"}
                  </span>
                  <span className="ml-2 text-slate-600">
                    {ticket.queue_definitions?.name ?? "Fila"} · prioridade {ticket.priority} ·{" "}
                    {ticket.status}
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
