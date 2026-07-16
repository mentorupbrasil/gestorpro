import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { callEventListSchema, displayPanelListSchema } from "@/features/display/schemas";
import { queueTicketListSchema } from "@/features/encounters/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ENCOUNTER_WORKER_EMBED, QUEUE_TICKET_DEFINITION_EMBED, QUEUE_TICKET_ENCOUNTER_EMBED } from "@/lib/supabase/embeds";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { DisplayForms } from "./display-forms";

export default async function DisplayPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "display.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Chamadas persistidas" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [unitsResult, panelsResult, ticketsResult, callsResult] = await Promise.all([
    supabase
      .from("clinic_units")
      .select("id, name")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("display_panels")
      .select("id, code, name, channel_name, status")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("queue_tickets")
      .select(
        `id, status, priority, created_at, ${QUEUE_TICKET_DEFINITION_EMBED}(name), ${QUEUE_TICKET_ENCOUNTER_EMBED}(${ENCOUNTER_WORKER_EMBED}(full_name))`,
      )
      .eq("tenant_id", context.tenantId)
      .in("status", ["waiting", "called"]),
    supabase
      .from("call_events")
      .select("id, action, status, payload_public, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (unitsResult.error || panelsResult.error || ticketsResult.error || callsResult.error) {
    return (
      <PageLoadError
        title="Chamadas persistidas"
        detail={describeSupabaseFailure(
          [unitsResult, panelsResult, ticketsResult, callsResult],
          "Não foi possível carregar o painel de chamadas.",
        )}
      />
    );
  }

  const parsedPanels = displayPanelListSchema.safeParse(panelsResult.data);
  const parsedTickets = queueTicketListSchema.safeParse(ticketsResult.data);
  const parsedCalls = callEventListSchema.safeParse(callsResult.data);
  if (!parsedPanels.success || !parsedTickets.success || !parsedCalls.success) {
    return (
      <PageLoadError
        title="Chamadas persistidas"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed). Atualize migrations ou contate suporte."
      />
    );
  }
  const panels = parsedPanels.data;
  const tickets = parsedTickets.data;
  const calls = parsedCalls.data;

  return (
    <div>
      <PageHeader
        description="Realtime é transporte: a chamada é persistida antes de qualquer publicação. Payload de TV permanece mínimo e sem CPF, empresa, exame, diagnóstico ou resultado."
        eyebrow="Painel de chamadas"
        title="Chamadas persistidas"
      />

      <DisplayForms
        clinicUnits={(unitsResult.data ?? []).map((unit) => ({ id: unit.id, name: unit.name }))}
        panels={panels.map((panel) => ({ id: panel.id, name: `${panel.name} · ${panel.status}` }))}
        tickets={tickets.map((ticket) => ({
          id: ticket.id,
          name: `${ticket.encounters?.workers?.full_name ?? "Ticket"} · ${
            ticket.queue_definitions?.name ?? "Fila"
          }`,
        }))}
      />

      <Surface className="mt-4 p-4">
        <h2 className="text-base font-semibold text-gp-text">Histórico recente</h2>
        {calls.length === 0 ? (
          <p className="mt-3 text-sm text-gp-text-muted">Nenhuma chamada registrada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gp-border text-sm">
            {calls.map((call) => (
              <li className="py-2.5" key={call.id}>
                <span className="font-semibold text-gp-text">{call.action}</span>
                <span className="ml-2 text-gp-text-muted">
                  {call.status} · {new Date(call.created_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
