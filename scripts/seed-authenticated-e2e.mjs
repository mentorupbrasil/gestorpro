import postgres from "postgres";

const requiredEnv = ["E2E_AUTH_EMAIL", "E2E_AUTH_PASSWORD", "PGHOST", "PGPASSWORD", "PGUSER"];

for (const name of requiredEnv) {
  if (!process.env[name]) {
    console.error(`${name} is required.`);
    process.exit(1);
  }
}

const sql = postgres({
  database: process.env.PGDATABASE ?? "postgres",
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: "require",
  user: process.env.PGUSER,
});

const tenantId = "c0000000-0000-4000-8000-000000000001";
const userId = "30000000-0000-4000-8000-000000000001";
const identityId = "30000000-0000-4000-8000-000000000101";
const membershipId = "c1000000-0000-4000-8000-000000000001";
const unitId = "c2000000-0000-4000-8000-000000000001";

try {
  await sql.begin(async (tx) => {
    await tx`
      delete from public.membership_roles
      where membership_id in (
        select id from public.tenant_memberships where tenant_id = ${tenantId}
      )
    `;

    await tx`
      delete from public.tenant_memberships
      where tenant_id = ${tenantId}
    `;

    await tx`
      delete from auth.mfa_challenges
      where factor_id in (
        select id from auth.mfa_factors where user_id = ${userId}
      )
    `;

    await tx`
      delete from auth.mfa_factors
      where user_id = ${userId}
    `;

    await tx`
      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        email_change_token_new,
        email_change,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        reauthentication_token,
        is_sso_user,
        is_anonymous
      ) values (
        ${userId},
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        ${process.env.E2E_AUTH_EMAIL},
        crypt(${process.env.E2E_AUTH_PASSWORD}, gen_salt('bf', 10)),
        now(),
        '',
        null,
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
          'sub', ${userId}::text,
          'email', ${process.env.E2E_AUTH_EMAIL}::text,
          'email_verified', true,
          'phone_verified', false
        ),
        false,
        now(),
        now(),
        '',
        '',
        '',
        '',
        0,
        '',
        false,
        false
      )
      on conflict (id) do update set
        email = excluded.email,
        encrypted_password = excluded.encrypted_password,
        email_confirmed_at = excluded.email_confirmed_at,
        confirmation_token = excluded.confirmation_token,
        confirmation_sent_at = excluded.confirmation_sent_at,
        recovery_token = excluded.recovery_token,
        email_change_token_new = excluded.email_change_token_new,
        email_change = excluded.email_change,
        raw_app_meta_data = excluded.raw_app_meta_data,
        raw_user_meta_data = excluded.raw_user_meta_data,
        phone = excluded.phone,
        phone_change = excluded.phone_change,
        phone_change_token = excluded.phone_change_token,
        email_change_token_current = excluded.email_change_token_current,
        email_change_confirm_status = excluded.email_change_confirm_status,
        reauthentication_token = excluded.reauthentication_token,
        updated_at = now(),
        deleted_at = null,
        banned_until = null
    `;

    await tx`
      insert into auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        ${identityId}::uuid,
        ${userId}::text,
        ${userId}::uuid,
        jsonb_build_object(
          'sub', ${userId}::text,
          'email', ${process.env.E2E_AUTH_EMAIL}::text,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
      )
      on conflict (provider, provider_id) do update set
        identity_data = excluded.identity_data,
        updated_at = now()
    `;

    await tx`
      insert into public.user_profiles (id, display_name, status)
      values (${userId}, 'Usuário E2E Fictício', 'active')
      on conflict (id) do update set
        display_name = excluded.display_name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.tenants (id, legal_name, trade_name, status)
      values (${tenantId}, 'Tenant E2E Fictício', 'E2E', 'active')
      on conflict (id) do update set
        legal_name = excluded.legal_name,
        trade_name = excluded.trade_name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.clinic_units (id, tenant_id, code, name, status)
      values (${unitId}, ${tenantId}, 'E2E-01', 'Unidade E2E Fictícia', 'active')
      on conflict (id) do update set
        code = excluded.code,
        name = excluded.name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.tenant_memberships (id, tenant_id, user_id, status, valid_from, valid_until)
      values (${membershipId}, ${tenantId}, ${userId}, 'active', now() - interval '1 minute', null)
      on conflict (tenant_id, user_id) do update set
        status = 'active',
        valid_from = now() - interval '1 minute',
        valid_until = null,
        updated_at = now()
    `;

    await tx`
      insert into public.membership_roles (membership_id, role_id)
      select ${membershipId}, id
      from public.roles
      where tenant_id is null and code = 'tenant_admin'
      on conflict do nothing
    `;
  });

  console.log("Authenticated E2E seed is ready.");
} finally {
  await sql.end({ timeout: 5 });
}
