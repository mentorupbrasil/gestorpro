import fs from "node:fs/promises";
import postgres from "postgres";

const requiredEnv = [
  "PGHOST",
  "PGPASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
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

const projectTables = [
  "audit_logs",
  "clinic_units",
  "membership_roles",
  "permissions",
  "role_permissions",
  "roles",
  "tenant_memberships",
  "tenants",
  "user_profiles",
];

async function shouldApplyMigration() {
  const rows = await connection`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in ${connection(projectTables)}
    order by tablename
  `;

  if (rows.length === 0) return true;

  if (rows.length === projectTables.length) return false;

  throw new Error(`Partial project schema exists: ${rows.map((row) => row.tablename).join(", ")}`);
}

async function applyMigration() {
  const migration = await fs.readFile(
    "supabase/migrations/202607120001_phase1_platform.sql",
    "utf8",
  );
  await connection.unsafe(migration);
}

async function validateRls() {
  await connection
    .begin(async (sql) => {
      await sql`
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
      values
        ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-a@example.invalid', '', now(), now()),
        ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'user-b@example.invalid', '', now(), now())
    `;

      await sql`
      insert into public.user_profiles (id, display_name)
      values
        ('10000000-0000-4000-8000-000000000001', 'Pessoa Ficticia A'),
        ('20000000-0000-4000-8000-000000000002', 'Pessoa Ficticia B')
    `;

      await sql`
      insert into public.tenants (id, legal_name)
      values
        ('a0000000-0000-4000-8000-000000000001', 'Tenant Ficticio A'),
        ('b0000000-0000-4000-8000-000000000002', 'Tenant Ficticio B')
    `;

      await sql`
      insert into public.tenant_memberships (id, tenant_id, user_id)
      values
        ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
        ('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002')
    `;

      await sql`
      insert into public.roles (id, tenant_id, code, name)
      values ('a2000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'tenant_reader', 'Leitura do tenant')
    `;

      await sql`
      insert into public.role_permissions (role_id, permission_id)
      select 'a2000000-0000-4000-8000-000000000001', id
      from public.permissions
      where code in ('tenant.read', 'units.manage')
    `;

      await sql`
      insert into public.membership_roles (membership_id, role_id)
      values ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000001')
    `;

      await sql`set local role authenticated`;
      await sql`select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true)`;
      await sql`select set_config('request.jwt.claim.role', 'authenticated', true)`;
      await sql`select set_config(
        'request.jwt.claims',
        ${JSON.stringify({
          sub: "10000000-0000-4000-8000-000000000001",
          role: "authenticated",
          aal: "aal2",
        })},
        true
      )`;

      const visibleTenants = await sql`select count(*)::int as count from public.tenants`;
      if (visibleTenants[0].count !== 1) {
        throw new Error(`Expected tenant A to see 1 tenant, saw ${visibleTenants[0].count}.`);
      }

      await sql.unsafe(`
      do $$
      begin
        begin
          perform public.get_my_authorization_context('b0000000-0000-4000-8000-000000000002');
          raise exception 'tenant A resolved tenant B context unexpectedly';
        exception when sqlstate '42501' then
          null;
        end;
      end $$;
    `);

      const createdUnit = await sql`
      select public.create_clinic_unit(
        'a0000000-0000-4000-8000-000000000001',
        'FOR-01',
        'Unidade Ficticia Fortaleza',
        'phase1-validation-request-1'
      ) as id
    `;

      if (!createdUnit[0].id) throw new Error("Authorized operation did not create a clinic unit.");

      await sql.unsafe(`
      do $$
      begin
        begin
          perform public.set_membership_status(
            'a0000000-0000-4000-8000-000000000001',
            'a1000000-0000-4000-8000-000000000001',
            'blocked',
            'phase1-validation-request-2'
          );
          raise exception 'admin changed own membership unexpectedly';
        exception when sqlstate '42501' then
          null;
        end;
      end $$;
    `);

      await sql`reset role`;

      await sql.unsafe(`
      do $$
      begin
        begin
          update public.audit_logs set action = 'tampered' where request_id = 'phase1-validation-request-1';
          raise exception 'audit row updated unexpectedly';
        exception when sqlstate '42501' then
          null;
        end;
      end $$;
    `);

      await sql`
      update public.tenant_memberships
      set status = 'blocked'
      where id = 'a1000000-0000-4000-8000-000000000001'
    `;

      await sql`set local role authenticated`;
      await sql`select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true)`;

      const blockedTenants = await sql`select count(*)::int as count from public.tenants`;
      if (blockedTenants[0].count !== 0) {
        throw new Error(`Expected blocked user to see 0 tenants, saw ${blockedTenants[0].count}.`);
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
  await validateRls();
  console.log("Phase 1 migration and RLS validation passed.");
} finally {
  await connection.end({ timeout: 5 });
}
