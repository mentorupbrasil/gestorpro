import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function IntegrationsPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const context = await resolveAuthorizationContext(selectedTenantId);
  requirePermission(context, "integrations.read");

  const supabase = await createServerSupabaseClient();
  const [
    connectionsResult,
    jobsResult,
    esocialResult,
    messagesResult,
    equipmentResult,
    deadLettersResult,
  ] = await Promise.all([
    supabase
      .from("integration_connections")
      .select("id, provider, connection_type, display_name, status")
      .eq("tenant_id", context.tenantId)
      .order("display_name"),
    supabase
      .from("integration_jobs")
      .select("id, job_type, status, attempts, next_attempt_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("esocial_events")
      .select("id, event_type, environment, operation_type, status, payload_version")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("message_queue")
      .select("id, channel, recipient_redacted, status, attempts, scheduled_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("equipment_registry")
      .select("id, code, name, equipment_type, status")
      .eq("tenant_id", context.tenantId)
      .order("name"),
    supabase
      .from("integration_dead_letters")
      .select("id, reason_redacted, created_at")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (
    connectionsResult.error ||
    jobsResult.error ||
    esocialResult.error ||
    messagesResult.error ||
    equipmentResult.error ||
    deadLettersResult.error
  ) {
    throw new Error("Não foi possível carregar integrações.");
  }

  const connections = connectionsResult.data ?? [];
  const jobs = jobsResult.data ?? [];
  const esocialEvents = esocialResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const equipment = equipmentResult.data ?? [];
  const deadLetters = deadLettersResult.data ?? [];

  return (
    <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4">
      <header className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Integrações
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Webhooks, eSocial, mensagens e conector
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Integrações ficam idempotentes, com payload redigido e dead-letter. eSocial segue sem
          envio real até validação oficial separada.
        </p>
      </header>

      <section className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Conexões" value={connections.length} />
        <Metric label="Jobs" value={jobs.length} />
        <Metric label="eSocial" value={esocialEvents.length} />
        <Metric label="Mensagens" value={messages.length} />
        <Metric label="Equipamentos" value={equipment.length} />
        <Metric label="Dead-letter" value={deadLetters.length} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel empty="Nenhuma conexão cadastrada." title="Conexões">
          {connections.map((connection) => (
            <li className="py-3" key={connection.id}>
              <span className="font-semibold">{connection.display_name}</span>
              <span className="ml-2 text-sm text-slate-600">
                {connection.provider} · {connection.connection_type} · {connection.status}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Nenhum evento eSocial criado." title="Eventos eSocial">
          {esocialEvents.map((event) => (
            <li className="py-3" key={event.id}>
              <span className="font-semibold">{event.event_type}</span>
              <span className="ml-2 text-sm text-slate-600">
                {event.environment} · {event.operation_type} · {event.status} · v
                {event.payload_version}
              </span>
            </li>
          ))}
        </Panel>
      </section>
    </main>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-950">{value}</p>
    </div>
  );
}

function Panel({
  children,
  empty,
  title,
}: Readonly<{ children: React.ReactNode[]; empty: string; title: string }>) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{empty}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">{children}</ul>
      )}
    </div>
  );
}
