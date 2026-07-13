import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

const migrationPath =
  "supabase/migrations/202607140002_triage_operational_hardening.sql";

const tenantA = "f1000000-0000-4000-8000-000000000001";
const tenantB = "f2000000-0000-4000-8000-000000000001";
const unitA = "f1100000-0000-4000-8000-000000000001";
const unitB = "f2100000-0000-4000-8000-000000000001";
const nurseId = "f1200000-0000-4000-8000-000000000001";
const readerId = "f1300000-0000-4000-8000-000000000001";
const outsiderId = "f2200000-0000-4000-8000-000000000001";
const workerId = "f1400000-0000-4000-8000-000000000001";
const encounterId = "f1500000-0000-4000-8000-000000000001";
const triageStepId = "f1510000-0000-4000-8000-000000000001";
const consultStepId = "f1520000-0000-4000-8000-000000000001";
const templateId = "f1600000-0000-4000-8000-000000000001";
const formVersionId = "f1610000-0000-4000-8000-000000000001";
const membershipNurse = "f1210000-0000-4000-8000-000000000001";
const membershipReader = "f1310000-0000-4000-8000-000000000001";
const membershipOutsider = "f2210000-0000-4000-8000-000000000001";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function createConnection() {
  const usePgEnv =
    process.env.PGHOST &&
    process.env.PGPASSWORD &&
    process.env.PGUSER &&
    !process.env.FORCE_DATABASE_URL;

  const connectionString =
    !usePgEnv && (process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? null);

  if (connectionString) {
    return postgres(connectionString, {
      idle_timeout: 2,
      max: 1,
      onnotice: () => {},
    });
  }

  if (!process.env.PGHOST || !process.env.PGPASSWORD) {
    console.error(
      "Configure .env com MIGRATION_DATABASE_URL ou PGHOST+PGPASSWORD do Supabase autorizado.",
    );
    process.exit(1);
  }

  return postgres({
    database: process.env.PGDATABASE ?? "postgres",
    host: process.env.PGHOST,
    idle_timeout: 2,
    max: 1,
    onnotice: () => {},
    password: process.env.PGPASSWORD,
    port: Number(process.env.PGPORT ?? 5432),
    ssl: process.env.PGSSL === "false" ? false : "require",
    user: process.env.PGUSER ?? "postgres",
  });
}

async function setAuth(sql, userId, aal = "aal2") {
  await sql`set local role authenticated`;
  await sql`select set_config('request.jwt.claim.sub', ${userId}, true)`;
  await sql`select set_config(
    'request.jwt.claims',
    ${JSON.stringify({ sub: userId, role: "authenticated", aal })},
    true
  )`;
}

async function expectSqlState(sql, state, run) {
  try {
    await run();
    throw new Error(`Expected SQLSTATE ${state}, but statement succeeded.`);
  } catch (error) {
    if (error?.code !== state) throw error;
  }
}

async function applyMigration(connection) {
  const migration = await fs.readFile(migrationPath, "utf8");
  await connection.unsafe(migration);
}

async function validateTriage(connection) {
  const payload = {
    anthropometry: { heightCm: 170, weightKg: 70 },
    vitalSigns: { bloodPressure: "120/80", heartRateBpm: 72 },
  };
  const reason = "Validação fictícia P0.1";

  await connection
    .begin(async (sql) => {
      for (const [userId, email] of [
        [nurseId, "triage-nurse@example.invalid"],
        [readerId, "triage-reader@example.invalid"],
        [outsiderId, "triage-outsider@example.invalid"],
      ]) {
        await sql`
          insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
          values (
            ${userId}::uuid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            ${email},
            '',
            now(),
            now()
          )
          on conflict (id) do nothing
        `;
        await sql`
          insert into public.user_profiles (id, display_name, status)
          values (${userId}::uuid, ${`Perfil fictício ${email}`}, 'active')
          on conflict (id) do nothing
        `;
      }

      for (const [tenantId, unitId, label] of [
        [tenantA, unitA, "Tenant fictício A"],
        [tenantB, unitB, "Tenant fictício B"],
      ]) {
        await sql`
          insert into public.tenants (id, legal_name, trade_name, status)
          values (${tenantId}::uuid, ${label}, ${label}, 'active')
          on conflict (id) do nothing
        `;
        await sql`
          insert into public.clinic_units (id, tenant_id, code, name, status)
          values (${unitId}::uuid, ${tenantId}::uuid, ${`${label}-U1`}, ${`Unidade ${label}`}, 'active')
          on conflict (id) do nothing
        `;
      }

      await sql`
        insert into public.tenant_memberships (id, tenant_id, user_id, status, valid_from)
        values
          (${membershipNurse}::uuid, ${tenantA}::uuid, ${nurseId}::uuid, 'active', now() - interval '1 minute'),
          (${membershipReader}::uuid, ${tenantA}::uuid, ${readerId}::uuid, 'active', now() - interval '1 minute'),
          (${membershipOutsider}::uuid, ${tenantB}::uuid, ${outsiderId}::uuid, 'active', now() - interval '1 minute')
        on conflict (id) do nothing
      `;

      await sql`
        insert into public.membership_roles (membership_id, role_id)
        select ${membershipNurse}::uuid, id
        from public.roles
        where tenant_id is null and code = 'tenant_admin'
        on conflict do nothing
      `;

      await sql`
        insert into public.roles (id, tenant_id, code, name)
        values ('f1311000-0000-4000-8000-000000000001'::uuid, ${tenantA}::uuid, 'reader_only', 'Leitor clínico fictício')
        on conflict do nothing
      `;

      await sql`
        insert into public.role_permissions (role_id, permission_id)
        select 'f1311000-0000-4000-8000-000000000001'::uuid, permission.id
        from public.permissions permission
        where permission.code = 'clinical.read'
        on conflict do nothing
      `;

      await sql`
        insert into public.membership_roles (membership_id, role_id)
        values (${membershipReader}::uuid, 'f1311000-0000-4000-8000-000000000001'::uuid)
        on conflict do nothing
      `;

      await sql`
        insert into public.membership_roles (membership_id, role_id)
        select ${membershipOutsider}::uuid, id
        from public.roles
        where tenant_id is null and code = 'tenant_admin'
        on conflict do nothing
      `;

      await sql`
        insert into public.workers (id, tenant_id, full_name, status)
        values (${workerId}::uuid, ${tenantA}::uuid, 'Trabalhador fictício triagem', 'active')
        on conflict (id) do nothing
      `;

      await sql`
        insert into public.encounters (id, tenant_id, clinic_unit_id, worker_id, status)
        values (${encounterId}::uuid, ${tenantA}::uuid, ${unitA}::uuid, ${workerId}::uuid, 'checked_in')
        on conflict (id) do nothing
      `;

      await sql`
        insert into public.encounter_steps (id, tenant_id, encounter_id, step_type, status, sequence)
        values
          (${triageStepId}::uuid, ${tenantA}::uuid, ${encounterId}::uuid, 'triage', 'available', 1),
          (${consultStepId}::uuid, ${tenantA}::uuid, ${encounterId}::uuid, 'consultation', 'blocked', 2)
        on conflict (id) do nothing
      `;

      await sql`
        insert into public.triage_form_templates (id, tenant_id, code, name, status)
        values (${templateId}::uuid, ${tenantA}::uuid, 'TRIAGE_E2E', 'Triagem fictícia', 'active')
        on conflict (id) do nothing
      `;

      await sql`
        insert into public.triage_form_versions (
          id, tenant_id, template_id, version, schema_json, status, approved_by, approved_at
        )
        values (
          ${formVersionId}::uuid,
          ${tenantA}::uuid,
          ${templateId}::uuid,
          1,
          '{"sections":[]}'::jsonb,
          'approved',
          ${nurseId}::uuid,
          now()
        )
        on conflict (id) do nothing
      `;

      await setAuth(sql, nurseId, "aal1");
      await expectSqlState(sql, "42501", async () => {
        await sql`
          select public.save_triage_record(
            ${tenantA}::uuid,
            ${encounterId}::uuid,
            ${formVersionId}::uuid,
            ${sql.json(payload)},
            false,
            ${reason},
            'triage-val-aal1'
          )
        `;
      });

      await setAuth(sql, nurseId, "aal2");
      const [draftRecordId] = await sql`
        select public.save_triage_record(
          ${tenantA}::uuid,
          ${encounterId}::uuid,
          ${formVersionId}::uuid,
          ${sql.json(payload)},
          false,
          ${reason},
          'triage-val-draft'
        ) as record_id
      `;

      const [versionRow] = await sql`
        select version, payload
        from public.triage_record_versions
        where triage_record_id = ${draftRecordId.recordId}::uuid
        order by version desc
        limit 1
      `;

      if (versionRow.version !== 1) {
        throw new Error(`Expected triage version 1, got ${versionRow.version}.`);
      }

      const bmi = versionRow.payload?.anthropometry?.bmi;
      if (Number(bmi) !== 24.2) {
        throw new Error(`Expected BMI 24.2, got ${bmi}.`);
      }

      await sql`
        select public.save_triage_record(
          ${tenantA}::uuid,
          ${encounterId}::uuid,
          ${formVersionId}::uuid,
          ${sql.json({
            ...payload,
            anthropometry: { heightCm: 170, weightKg: 71 },
          })},
          false,
          ${reason},
          'triage-val-draft-2'
        )
      `;

      const [persisted] = await sql`
        select count(*)::int as count
        from public.triage_record_versions
        where triage_record_id = ${draftRecordId.recordId}::uuid
      `;
      if (persisted.count !== 2) {
        throw new Error(`Expected 2 triage versions after reload simulation, got ${persisted.count}.`);
      }

      await sql`
        select public.save_triage_record(
          ${tenantA}::uuid,
          ${encounterId}::uuid,
          ${formVersionId}::uuid,
          ${sql.json({
            ...payload,
            anthropometry: { heightCm: 170, weightKg: 71 },
          })},
          true,
          ${reason},
          'triage-val-close'
        )
      `;

      const [triageStep] = await sql`
        select status
        from public.encounter_steps
        where id = ${triageStepId}::uuid
      `;
      const [consultStep] = await sql`
        select status
        from public.encounter_steps
        where id = ${consultStepId}::uuid
      `;

      if (triageStep.status !== "completed") {
        throw new Error(`Expected triage step completed, got ${triageStep.status}.`);
      }
      if (consultStep.status !== "available") {
        throw new Error(`Expected consultation available, got ${consultStep.status}.`);
      }

      const [eventCount] = await sql`
        select count(*)::int as count
        from public.encounter_events
        where encounter_id = ${encounterId}::uuid
          and event_type = 'triage.completed'
      `;
      const [auditCount] = await sql`
        select count(*)::int as count
        from public.audit_logs
        where resource_type = 'triage_records'
          and resource_id = ${draftRecordId.recordId}::uuid
          and action = 'triage.completed'
      `;

      if (eventCount.count < 1 || auditCount.count < 1) {
        throw new Error("Expected triage.completed event and audit log.");
      }

      await setAuth(sql, readerId, "aal2");
      await expectSqlState(sql, "42501", async () => {
        await sql`
          select public.save_triage_record(
            ${tenantA}::uuid,
            ${encounterId}::uuid,
            ${formVersionId}::uuid,
            ${sql.json(payload)},
            false,
            ${reason},
            'triage-val-no-perm'
          )
        `;
      });

      await setAuth(sql, outsiderId, "aal2");
      await expectSqlState(sql, "42501", async () => {
        await sql`
          select public.save_triage_record(
            ${tenantA}::uuid,
            ${encounterId}::uuid,
            ${formVersionId}::uuid,
            ${sql.json(payload)},
            false,
            ${reason},
            'triage-val-tenant-b'
          )
        `;
      });

      const [queueRow] = await sql`
        select count(*)::int as count
        from public.encounters encounter
        where encounter.tenant_id = ${tenantA}::uuid
          and encounter.clinic_unit_id = ${unitA}::uuid
          and encounter.status in ('checked_in', 'in_progress', 'waiting')
      `;
      if (queueRow.count < 1) {
        throw new Error("Expected encounter visible in authorized unit queue.");
      }

      throw new Error("rollback triage validation data");
    })
    .catch((error) => {
      if (error?.message !== "rollback triage validation data") throw error;
    });
}

loadEnvFile();
const connection = createConnection();

try {
  await applyMigration(connection);
  await validateTriage(connection);
  console.log("P0.1 triage migration applied and checklist validation passed.");
} finally {
  await connection.end({ timeout: 5 });
}
