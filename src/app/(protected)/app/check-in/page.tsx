import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PageLoadError, describeSupabaseFailure } from "@/components/ui/page-load-error";
import { loadWorkspaceAuth } from "@/core/auth/load-workspace-auth";
import { encounterListSchema, queueTicketListSchema } from "@/features/encounters/schemas";
import { embeddedOneSchema } from "@/lib/supabase/relations";
import {
  APPOINTMENT_REFERRAL_EMBED,
  APPOINTMENT_RESOURCE_EMBED,
  ENCOUNTER_EXAM_ORDERS_EMBED,
  ENCOUNTER_WORKER_EMBED,
  QUEUE_TICKET_DEFINITION_EMBED,
  QUEUE_TICKET_ENCOUNTER_EMBED,
  REFERRAL_COMPANY_EMBED,
  REFERRAL_WORKER_EMBED,
} from "@/lib/supabase/embeds";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader, Surface } from "@/components/ui/page-chrome";
import { ReceptionStation } from "./reception-station";

const receptionAppointmentSchema = z.array(
  z.object({
    ends_at: z.string(),
    id: z.uuid(),
    referrals: embeddedOneSchema(
      z.object({
        companies: embeddedOneSchema(
          z.object({ trade_name: z.string().nullable(), legal_name: z.string() }),
        ),
        id: z.uuid(),
        occupational_exam_type: z.string(),
        workers: embeddedOneSchema(z.object({ full_name: z.string() })),
      }),
    ).nullable(),
    schedule_resources: embeddedOneSchema(z.object({ name: z.string() })),
    starts_at: z.string(),
    status: z.string(),
  }),
);

export default async function CheckInPage() {
  const selectedTenantId = (await cookies()).get("gestorpro_tenant")?.value;
  if (!selectedTenantId) redirect("/select-tenant");

  const auth = await loadWorkspaceAuth(selectedTenantId, "encounters.read", "tenantOrUnit");
  if ("error" in auth) {
    return <PageLoadError title="Recepção operacional" detail={auth.error} />;
  }
  const context = auth.context;

  const supabase = await createServerSupabaseClient();
  const [appointmentsResult, encountersResult, queueResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `id, starts_at, ends_at, status, ${APPOINTMENT_RESOURCE_EMBED}(name), ${APPOINTMENT_REFERRAL_EMBED}(id, occupational_exam_type, ${REFERRAL_WORKER_EMBED}(full_name), ${REFERRAL_COMPANY_EMBED}(trade_name, legal_name))`,
      )
      .eq("tenant_id", context.tenantId)
      .in("status", ["scheduled", "confirmed"])
      .order("starts_at"),
    supabase
      .from("encounters")
      .select(
        `id, status, checked_in_at, ${ENCOUNTER_WORKER_EMBED}(full_name), ${ENCOUNTER_EXAM_ORDERS_EMBED}(id)`,
      )
      .eq("tenant_id", context.tenantId)
      .order("checked_in_at", { ascending: false })
      .limit(30),
    supabase
      .from("queue_tickets")
      .select(
        `id, status, priority, created_at, ${QUEUE_TICKET_DEFINITION_EMBED}(name), ${QUEUE_TICKET_ENCOUNTER_EMBED}(${ENCOUNTER_WORKER_EMBED}(full_name))`,
      )
      .eq("tenant_id", context.tenantId)
      .in("status", ["waiting", "called", "in_service"])
      .order("priority")
      .order("created_at"),
  ]);

  if (appointmentsResult.error || encountersResult.error || queueResult.error) {
    return (
      <PageLoadError
        title="Recepção operacional"
        detail={describeSupabaseFailure(
          [appointmentsResult, encountersResult, queueResult],
          "Não foi possível carregar a recepção.",
        )}
      />
    );
  }

  const parsedAppointments = receptionAppointmentSchema.safeParse(appointmentsResult.data);
  const parsedEncounters = encounterListSchema.safeParse(encountersResult.data);
  const parsedTickets = queueTicketListSchema.safeParse(queueResult.data);
  if (!parsedAppointments.success || !parsedEncounters.success || !parsedTickets.success) {
    return (
      <PageLoadError
        title="Recepção operacional"
        detail="Dados inconsistentes retornados pelo Supabase (relação/embed)."
      />
    );
  }

  const rows = parsedAppointments.data.map((appointment) => ({
    companyName:
      appointment.referrals?.companies?.trade_name?.trim() ||
      appointment.referrals?.companies?.legal_name ||
      "—",
    endsAt: appointment.ends_at,
    examType: appointment.referrals?.occupational_exam_type ?? "—",
    id: appointment.id,
    referralId: appointment.referrals?.id ?? null,
    resourceName: appointment.schedule_resources?.name ?? "Recurso",
    startsAt: appointment.starts_at,
    status: appointment.status,
    workerName: appointment.referrals?.workers?.full_name ?? "Sem trabalhador",
  }));

  return (
    <div>
      <PageHeader
        description="Estação de recepção: agenda do dia, busca, divergências de encaminhamento e check-in transacional (AAL2). Sem prontuário clínico nesta tela."
        eyebrow="Recepção"
        title="Estação operacional"
      />

      <ReceptionStation rows={rows} />

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Atendimentos recentes</h2>
          {parsedEncounters.data.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum atendimento em aberto.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {parsedEncounters.data.map((encounter) => (
                <li className="py-2.5" key={encounter.id}>
                  <span className="font-semibold text-gp-text">
                    {encounter.workers?.full_name ?? "Trabalhador"}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {encounter.status}
                    {(encounter.exam_orders?.length ?? 0) > 0
                      ? ` · ${encounter.exam_orders?.length} exame(s)`
                      : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="p-4">
          <h2 className="text-base font-semibold text-gp-text">Fila ativa</h2>
          {parsedTickets.data.length === 0 ? (
            <p className="mt-3 text-sm text-gp-text-muted">Nenhum ticket aguardando.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gp-border text-sm">
              {parsedTickets.data.map((ticket) => (
                <li className="py-2.5" key={ticket.id}>
                  <span className="font-semibold text-gp-text">
                    {ticket.encounters?.workers?.full_name ?? "Paciente"}
                  </span>
                  <span className="ml-2 text-gp-text-muted">
                    {ticket.queue_definitions?.name} · {ticket.status}
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
