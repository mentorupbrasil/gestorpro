import fs from "node:fs/promises";
import postgres from "postgres";

const requiredEnv = [
  "PGHOST",
  "PGPASSWORD",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
}

const connection = postgres({
  database: process.env.PGDATABASE ?? "postgres",
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: "require",
  transform: postgres.camel,
  user: process.env.PGUSER ?? "postgres",
});

async function shouldApplyMigration() {
  const rows = await connection`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename = 'companies'
  `;

  return rows.length === 0;
}

async function applyMigration() {
  const migration = await fs.readFile(
    "supabase/migrations/202607120002_phase2_occupational.sql",
    "utf8",
  );
  await connection.unsafe(migration);
}

async function validatePhase2() {
  await connection
    .begin(async (sql) => {
      await sql`
        insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
        values
          ('31000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-a@mentorup.com.br', '', now(), now()),
          ('32000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'phase2-b@mentorup.com.br', '', now(), now())
      `;

      await sql`
        insert into public.user_profiles (id, display_name)
        values
          ('31000000-0000-4000-8000-000000000001', 'Pessoa Fase 2 A'),
          ('32000000-0000-4000-8000-000000000002', 'Pessoa Fase 2 B')
      `;

      await sql`
        insert into public.tenants (id, legal_name)
        values
          ('c3000000-0000-4000-8000-000000000001', 'Tenant Fase 2 A'),
          ('c4000000-0000-4000-8000-000000000002', 'Tenant Fase 2 B')
      `;

      await sql`
        insert into public.tenant_memberships (id, tenant_id, user_id)
        values
          ('c3100000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001'),
          ('c4100000-0000-4000-8000-000000000002', 'c4000000-0000-4000-8000-000000000002', '32000000-0000-4000-8000-000000000002')
      `;

      await sql`
        insert into public.membership_roles (membership_id, role_id)
        select membership.id, role.id
        from public.tenant_memberships membership
        cross join public.roles role
        where role.tenant_id is null
          and role.code = 'tenant_admin'
          and membership.id in (
            'c3100000-0000-4000-8000-000000000001',
            'c4100000-0000-4000-8000-000000000002'
          )
      `;

      await sql`set local role authenticated`;
      await sql`select set_config('request.jwt.claim.sub', '31000000-0000-4000-8000-000000000001', true)`;
      await sql`select set_config('request.jwt.claim.role', 'authenticated', true)`;
      await sql`select set_config('request.jwt.claim.aal', 'aal2', true)`;

      const company = await sql`
        select public.create_occupational_company(
          'c3000000-0000-4000-8000-000000000001',
          'Empresa Ficticia Fase 2',
          'Fase 2',
          '12.345.678/0001-90',
          'phase2-company'
        ) as id
      `;

      await sql`
        insert into public.companies (tenant_id, legal_name, tax_id_normalized)
        values ('c4000000-0000-4000-8000-000000000002', 'Empresa Tenant B', '12345678000270')
      `;

      const visibleCompanies = await sql`select count(*)::int as count from public.companies`;
      if (visibleCompanies[0].count !== 1) {
        throw new Error(`Expected tenant A to see 1 company, saw ${visibleCompanies[0].count}.`);
      }

      const worker = await sql`
        select public.create_occupational_worker(
          'c3000000-0000-4000-8000-000000000001',
          'Trabalhador Ficticio',
          '123.456.789-09',
          'phase2-worker'
        ) as id
      `;

      await sql.unsafe(`
        do $$
        begin
          begin
            perform public.create_occupational_worker(
              'c3000000-0000-4000-8000-000000000001',
              'Trabalhador Duplicado',
              '123.456.789-09',
              'phase2-worker-duplicate'
            );
            raise exception 'duplicate worker identifier accepted unexpectedly';
          exception when unique_violation then
            null;
          end;
        end $$;
      `);

      await sql`
        insert into public.pcmso_programs (id, tenant_id, company_id, code, name)
        values (
          'c5000000-0000-4000-8000-000000000001',
          'c3000000-0000-4000-8000-000000000001',
          ${company[0].id},
          'PCMSO-01',
          'PCMSO Ficticio'
        )
      `;

      await sql`
        insert into public.pcmso_versions (
          id,
          tenant_id,
          company_id,
          pcmso_program_id,
          version_number,
          valid_from,
          valid_until,
          status,
          approved_at,
          content_hash
        )
        values (
          'c5100000-0000-4000-8000-000000000001',
          'c3000000-0000-4000-8000-000000000001',
          ${company[0].id},
          'c5000000-0000-4000-8000-000000000001',
          1,
          '2026-01-01',
          '2027-01-01',
          'approved',
          now(),
          'phase2-hash'
        )
      `;

      await sql.unsafe(`
        do $$
        begin
          begin
            update public.pcmso_versions
            set valid_from = '2026-02-01'
            where id = 'c5100000-0000-4000-8000-000000000001';
            raise exception 'approved PCMSO version changed unexpectedly';
          exception when sqlstate '42501' then
            null;
          end;
        end $$;
      `);

      const exam = await sql`
        insert into public.exam_catalog (tenant_id, code, name, result_type)
        values ('c3000000-0000-4000-8000-000000000001', 'CLINICO', 'Exame clinico', 'clinical')
        returning id
      `;

      const protocol = await sql`
        insert into public.exam_protocols (tenant_id, pcmso_version_id, occupational_exam_type, status)
        values (
          'c3000000-0000-4000-8000-000000000001',
          'c5100000-0000-4000-8000-000000000001',
          'admission',
          'approved'
        )
        returning id
      `;

      const override = await sql`
        select public.create_exam_protocol_override(
          'c3000000-0000-4000-8000-000000000001',
          null,
          ${worker[0].id},
          ${protocol[0].id},
          ${exam[0].id},
          'add',
          'Inclusao manual justificada para validacao da fase 2.',
          'phase2-override'
        ) as id
      `;

      if (!override[0].id) throw new Error("Manual override was not created.");

      const auditRows = await sql`
        select count(*)::int as count
        from public.audit_logs
        where request_id in ('phase2-company', 'phase2-worker', 'phase2-override')
      `;
      if (auditRows[0].count !== 3) {
        throw new Error(`Expected 3 audit rows, saw ${auditRows[0].count}.`);
      }

      throw new Error("rollback validation data");
    })
    .catch((error) => {
      if (error?.message !== "rollback validation data") throw error;
    });
}

try {
  if (await shouldApplyMigration()) {
    await applyMigration();
  }
  await validatePhase2();
  console.log("Phase 2 occupational migration and validation passed.");
} finally {
  await connection.end({ timeout: 5 });
}
