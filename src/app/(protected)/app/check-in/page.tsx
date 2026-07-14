import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { encounterListSchema, queueTicketListSchema } from "@/features/encounters/schemas";
import { appointmentListSchema } from "@/features/scheduling/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { CheckInForm } from "./check-in-form";

export default async function CheckInPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "encounters.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Check-in transacional" detail={auth.error} />;
  }
  const context = auth.context;

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
    return (
      <PageLoadError
        title="Check-in transacional"
        detail={describeSupabaseFailure(
          [appointmentsResult, encountersResult, queueResult],
          "Não foi possível carregar check-in e filas.",
        )}
      />
    );
  }

  const parsedAppointments = appointmentListSchema.safeParse(appointmentsResult.data);
  const parsedEncounters = encounterListSchema.safeParse(encountersResult.data);
  const parsedTickets = queueTicketListSchema.safeParse(queueResult.data);
  if (!parsedAppointments.success || !parsedEncounters.success || !parsedTickets.success) {
    return (
      <PageLoadError
        title="Check-in transacional"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const appointments = parsedAppointments.data;
  const encounters = parsedEncounters.data;
  const tickets = parsedTickets.data;

  return (
    <div>
      <PageHeader
        description="O check-in cria atendimento, snapshot com preview do protocolo, etapas (recepção → triagem → exame → consulta → documento), pedidos a partir do encaminhamento, filas, auditoria e outbox em uma única transação (AAL2)."
        eyebrow="Check-in e filas"
        title="Check-in transacional"
      />

      <CheckInForm
        appointments={appointments.map((appointment) => ({
          id: appointment.id,
          label: `${new Date(appointment.starts_at).toLocaleString("pt-BR")} · ${
            appointment.schedule_resources?.name ?? "Recurso"
          }`,
        }))}
      />

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Atendimentos</h2>
          {encounters.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum atendimento em aberto.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {encounters.map((encounter) => {
                const examCount = encounter.exam_orders?.length ?? 0;
                return (
                  <li className="py-2.5" key={encounter.id}>
                    <span className="font-semibold text-gp-text">
                      {encounter.workers?.full_name ?? "Trabalhador"}
                    </span>
                    <span className="ml-2 text-gp-text-muted">
                      {encounter.status}
                      {examCount > 0 ? ` · ${examCount} pedido(s) de exame` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>

        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Fila</h2>
          {tickets.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum ticket aguardando.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {tickets.map((ticket) => (
                <li className="py-2.5" key={ticket.id}>
                  <span className="font-semibold text-gp-text">
                    {ticket.encounters?.workers?.full_name ?? "Trabalhador"}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {ticket.queue_definitions?.name ?? "Fila"} · prioridade {ticket.priority} ·{" "}
                    {ticket.status}
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
