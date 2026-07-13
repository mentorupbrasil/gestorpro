import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { callEventListSchema, displayPanelListSchema } from "@/features/display/schemas";
import { queueTicketListSchema } from "@/features/encounters/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DisplayForms } from "./display-forms";

export default async function DisplayPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "display.read");

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
        "id, status, priority, created_at, queue_definitions(name), encounters(workers(full_name))",
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
    throw new Error("Não foi possível carregar o painel de chamadas.");
  }

  const panels = displayPanelListSchema.parse(panelsResult.data);
  const tickets = queueTicketListSchema.parse(ticketsResult.data);
  const calls = callEventListSchema.parse(callsResult.data);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Painel de chamadas
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Chamadas persistidas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Realtime é transporte: a chamada é persistida antes de qualquer publicação. Payload de TV
          permanece mínimo e sem CPF, empresa, exame, diagnóstico ou resultado.
        </p>
      </header>

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

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Histórico recente</h2>
        {calls.length === 0 ? (
          <p className="mt-3 rounded bg-slate-100 p-4 text-sm text-slate-700">
            Nenhuma chamada registrada.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 text-sm">
            {calls.map((call) => (
              <li className="py-3" key={call.id}>
                <span className="font-semibold">{call.action}</span>
                <span className="ml-2 text-slate-600">
                  {call.status} · {new Date(call.created_at).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
