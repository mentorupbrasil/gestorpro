import { readFileSync } from "node:fs";
import postgres from "postgres";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i < 0) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(i + 1).trim()] = t.slice(i + 1).trim();
}

const sql = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  max: 1,
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT),
  ssl: "require",
  user: process.env.PGUSER,
});

const tenantId = "c0000000-0000-4000-8000-000000000001";
const userId = "30000000-0000-4000-8000-000000000001";
const unitId = "c2000000-0000-4000-8000-000000000001";
const workerId = "d1000000-0000-4000-8000-000000000001";
const appointmentId = "d8000000-0000-4000-8000-000000000001";
const referralId = "d6000000-0000-4000-8000-000000000001";
const encounterId = "e8000000-0000-4000-8000-000000000001";
const templateId = "e8100000-0000-4000-8000-000000000001";
const formVersionId = "e8110000-0000-4000-8000-000000000001";
const physicianId = "e8200000-0000-4000-8000-000000000001";
const triageStepId = "e8210000-0000-4000-8000-000000000001";
const consultStepId = "e8220000-0000-4000-8000-000000000001";
const receptionStepId = "e8230000-0000-4000-8000-000000000001";

try {
  await sql.begin(async (tx) => {
    await tx`
      update public.appointments
      set status = 'confirmed', starts_at = now() - interval '30 minutes', ends_at = now() + interval '30 minutes'
      where id = ${appointmentId}::uuid
    `;

    await tx`
      insert into public.triage_form_templates (id, tenant_id, code, name, status)
      values (${templateId}::uuid, ${tenantId}::uuid, 'TRIAGEM_DEMO', 'Triagem demonstração fictícia', 'active')
      on conflict (id) do update set status = 'active'
    `;

    await tx`
      insert into public.triage_form_versions (
        id, tenant_id, template_id, version, schema_json, status, approved_by, approved_at
      ) values (
        ${formVersionId}::uuid, ${tenantId}::uuid, ${templateId}::uuid, 1,
        '{"sections":["vitals","anthropometry"]}'::jsonb, 'approved', ${userId}::uuid, now()
      )
      on conflict (id) do update set status = 'approved'
    `;

    await tx`
      insert into public.clinical_professional_credentials (
        id, tenant_id, user_id, clinic_unit_id, professional_role,
        council_code, council_region, registration_number, status
      ) values (
        ${physicianId}::uuid, ${tenantId}::uuid, ${userId}::uuid, ${unitId}::uuid, 'physician',
        'CRM', 'SP', '123456', 'active'
      )
      on conflict (id) do update set status = 'active'
    `;

    await tx`
      insert into public.encounters (
        id, tenant_id, clinic_unit_id, worker_id, appointment_id, referral_id, status, checked_in_at
      ) values (
        ${encounterId}::uuid, ${tenantId}::uuid, ${unitId}::uuid, ${workerId}::uuid,
        ${appointmentId}::uuid, ${referralId}::uuid, 'checked_in', now() - interval '20 minutes'
      )
      on conflict (id) do update set status = 'checked_in', checked_in_at = now() - interval '20 minutes'
    `;

    await tx`
      insert into public.encounter_steps (id, tenant_id, encounter_id, step_type, status, sequence)
      values
        (${receptionStepId}::uuid, ${tenantId}::uuid, ${encounterId}::uuid, 'reception', 'completed', 1),
        (${triageStepId}::uuid, ${tenantId}::uuid, ${encounterId}::uuid, 'triage', 'available', 2),
        (${consultStepId}::uuid, ${tenantId}::uuid, ${encounterId}::uuid, 'consultation', 'blocked', 3)
      on conflict (id) do nothing
    `;

    await tx`
      update public.encounter_steps
      set status = 'available'
      where tenant_id = ${tenantId}::uuid and encounter_id = ${encounterId}::uuid and step_type = 'triage'
    `;
  });

  console.log("Demo clínico pronto.");
  console.log(`Encounter triagem: /app/clinical?encounter=${encounterId}`);
  console.log(`Após triagem: /app/clinical?consultation=${encounterId}`);
} finally {
  await sql.end({ timeout: 5 });
}
