import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/core/auth/authorization";
import { resolveAuthorizationContext } from "@/core/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { IntegrationsWorkspaceForms } from "./integrations-forms";

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
    connectorsResult,
    layoutsResult,
    spoolResult,
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
      .select("id, serial_number, equipment_type, status")
      .eq("tenant_id", context.tenantId)
      .order("serial_number"),
    supabase
      .from("integration_dead_letters")
      .select("id, reason_redacted, created_at, reprocessed_at")
      .eq("tenant_id", context.tenantId)
      .is("reprocessed_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("local_connectors")
      .select("id, connector_name, status")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("esocial_layout_versions")
      .select("id, version, technical_note, status")
      .eq("tenant_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("connector_spool_entries")
      .select("id, file_name, status, monitored_folder, detected_at")
      .eq("tenant_id", context.tenantId)
      .order("detected_at", { ascending: false })
      .limit(30),
  ]);

  if (
    connectionsResult.error ||
    jobsResult.error ||
    esocialResult.error ||
    messagesResult.error ||
    equipmentResult.error ||
    deadLettersResult.error ||
    connectorsResult.error ||
    layoutsResult.error ||
    spoolResult.error
  ) {
    throw new Error("Não foi possível carregar integrações.");
  }

  const connections = connectionsResult.data ?? [];
  const jobs = jobsResult.data ?? [];
  const esocialEvents = esocialResult.data ?? [];
  const messages = messagesResult.data ?? [];
  const equipment = equipmentResult.data ?? [];
  const deadLetters = deadLettersResult.data ?? [];
  const connectors = connectorsResult.data ?? [];
  const layouts = layoutsResult.data ?? [];
  const spool = spoolResult.data ?? [];

  return (
    <div>
      <PageHeader
        description="Jobs idempotentes, dead-letter reprocessável, spool de pasta monitorada e eSocial só em sandbox (`restricted_production`). Sem envio real de produção."
        eyebrow="Integrações"
        title="Webhooks, eSocial, mensagens e conector"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
        <Metric label="Conexões" value={connections.length} />
        <Metric label="Jobs" value={jobs.length} />
        <Metric label="eSocial" value={esocialEvents.length} />
        <Metric label="Mensagens" value={messages.length} />
        <Metric label="Equipamentos" value={equipment.length} />
        <Metric label="Spool" value={spool.length} />
        <Metric label="Dead-letter" value={deadLetters.length} />
      </section>

      <IntegrationsWorkspaceForms
        connectionOptions={connections.map((item) => ({
          id: item.id,
          label: `${item.display_name} · ${item.status}`,
        }))}
        connectorOptions={connectors.map((item) => ({
          id: item.id,
          label: `${item.connector_name} · ${item.status}`,
        }))}
        deadLetterOptions={deadLetters.map((item) => ({
          id: item.id,
          label: item.reason_redacted.slice(0, 64),
        }))}
        layoutOptions={layouts.map((item) => ({
          id: item.id,
          label: `${item.version} · ${item.technical_note} (${item.status})`,
        }))}
      />

      <section className="mt-4 grid gap-3 xl:grid-cols-2">
        <Panel empty="Nenhuma conexão cadastrada." title="Conexões">
          {connections.map((connection) => (
            <li className="py-2.5" key={connection.id}>
              <span className="font-semibold text-gp-text">{connection.display_name}</span>
              <span className="ml-2 text-sm text-gp-text-muted">
                {connection.provider} · {connection.connection_type} · {connection.status}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Nenhum evento eSocial criado." title="Eventos eSocial">
          {esocialEvents.map((event) => (
            <li className="py-2.5" key={event.id}>
              <span className="font-semibold text-gp-text">{event.event_type}</span>
              <span className="ml-2 text-sm text-gp-text-muted">
                {event.environment} · {event.operation_type} · {event.status} · v
                {event.payload_version}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Spool vazio." title="Pasta monitorada">
          {spool.map((entry) => (
            <li className="py-2.5" key={entry.id}>
              <span className="font-semibold text-gp-text">{entry.file_name}</span>
              <span className="ml-2 text-sm text-gp-text-muted">
                {entry.status} · {entry.monitored_folder}
              </span>
            </li>
          ))}
        </Panel>
        <Panel empty="Sem dead-letter aberta." title="Dead-letter aberta">
          {deadLetters.map((item) => (
            <li className="py-2.5" key={item.id}>
              <span className="font-semibold text-gp-text">{item.reason_redacted}</span>
            </li>
          ))}
        </Panel>
      </section>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <Surface className="p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gp-text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-gp-text">{value}</p>
    </Surface>
  );
}

function Panel({
  children,
  empty,
  title,
}: Readonly<{ children: React.ReactNode[]; empty: string; title: string }>) {
  return (
    <Surface className="p-4">
      <h2 className="text-base font-semibold text-gp-text">{title}</h2>
      {children.length === 0 ? (
        <p className="mt-3 text-sm text-gp-text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gp-border text-sm">{children}</ul>
      )}
    </Surface>
  );
}
