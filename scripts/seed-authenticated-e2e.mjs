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
const companyId = "d0000000-0000-4000-8000-000000000001";
const workerId = "d1000000-0000-4000-8000-000000000001";
const employmentId = "d2000000-0000-4000-8000-000000000001";
const pcmsoProgramId = "d3000000-0000-4000-8000-000000000001";
const pcmsoVersionId = "d4000000-0000-4000-8000-000000000001";
const examCatalogId = "d5000000-0000-4000-8000-000000000001";
const referralId = "d6000000-0000-4000-8000-000000000001";
const referralItemId = "d6100000-0000-4000-8000-000000000001";
const resourceId = "d7000000-0000-4000-8000-000000000001";
const appointmentId = "d8000000-0000-4000-8000-000000000001";

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
      insert into public.clinic_units (id, tenant_id, code, name, status, timezone)
      values (${unitId}, ${tenantId}, 'E2E-01', 'Unidade E2E Fictícia', 'active', 'America/Fortaleza')
      on conflict (id) do update set
        code = excluded.code,
        name = excluded.name,
        status = 'active',
        timezone = 'America/Fortaleza',
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

    // Papéis operacionais na unidade (tenant_admin não tem clínico após P0)
    for (const roleCode of [
      "unit_manager",
      "receptionist",
      "nursing",
      "occupational_physician",
      "exam_technician",
      "laboratory",
      "document_operator",
      "finance",
    ]) {
      await tx`
        insert into public.membership_roles (membership_id, role_id, clinic_unit_id)
        select ${membershipId}, role.id, ${unitId}
        from public.roles role
        where role.tenant_id is null and role.code = ${roleCode}
        on conflict do nothing
      `;
    }

    await tx`
      insert into public.companies (id, tenant_id, legal_name, trade_name, tax_id_normalized, status)
      values (
        ${companyId},
        ${tenantId},
        'Empresa Exemplo E2E Ltda. — DADO FICTÍCIO',
        'Empresa Exemplo E2E',
        '00000000000000',
        'active'
      )
      on conflict (id) do update set
        legal_name = excluded.legal_name,
        trade_name = excluded.trade_name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.workers (id, tenant_id, full_name, status)
      values (${workerId}, ${tenantId}, 'Trabalhador Fictício E2E', 'active')
      on conflict (id) do update set
        full_name = excluded.full_name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.employment_contracts (
        id, tenant_id, company_id, worker_id, starts_on, status
      ) values (
        ${employmentId}, ${tenantId}, ${companyId}, ${workerId}, current_date - 30, 'active'
      )
      on conflict (id) do update set
        status = 'active',
        ends_on = null,
        updated_at = now()
    `;

    await tx`
      insert into public.pcmso_programs (id, tenant_id, company_id, code, name, status)
      values (
        ${pcmsoProgramId}, ${tenantId}, ${companyId}, 'PCMSO_E2E',
        'PCMSO de demonstração — DADO FICTÍCIO', 'active'
      )
      on conflict (id) do update set
        name = excluded.name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.pcmso_versions (
        id, tenant_id, company_id, pcmso_program_id, version_number, valid_from, status, approved_at, content_hash
      ) values (
        ${pcmsoVersionId}, ${tenantId}, ${companyId}, ${pcmsoProgramId}, 1,
        current_date - 30, 'approved', now() - interval '1 day', 'e2e-pcmso-hash'
      )
      on conflict (id) do update set
        status = 'approved',
        approved_at = coalesce(public.pcmso_versions.approved_at, now()),
        valid_from = current_date - 30,
        updated_at = now()
    `;

    await tx`
      insert into public.exam_catalog (id, tenant_id, code, name, result_type, active)
      values (
        ${examCatalogId}, ${tenantId}, 'EXAME_E2E',
        'Exame ocupacional fictício E2E', 'other', true
      )
      on conflict (id) do update set
        name = excluded.name,
        active = true,
        updated_at = now()
    `;

    await tx`
      insert into public.referrals (
        id, tenant_id, company_id, worker_id, employment_contract_id,
        occupational_exam_type, status, valid_until, idempotency_key, exam_preview
      ) values (
        ${referralId}, ${tenantId}, ${companyId}, ${workerId}, ${employmentId},
        'periodic', 'scheduled', current_date + 30, 'demo-e2e-referral-v1',
        jsonb_build_array(jsonb_build_object('examCatalogId', ${examCatalogId}::text))
      )
      on conflict (id) do update set
        valid_until = current_date + 30,
        updated_at = now()
    `;

    await tx`
      insert into public.referral_items (
        id, tenant_id, referral_id, exam_catalog_id, source, status
      ) values (
        ${referralItemId}, ${tenantId}, ${referralId}, ${examCatalogId}, 'protocol', 'confirmed'
      )
      on conflict (id) do update set status = 'confirmed'
    `;

    await tx`
      insert into public.schedule_resources (
        id, tenant_id, clinic_unit_id, resource_type, code, name, status
      ) values (
        ${resourceId}, ${tenantId}, ${unitId}, 'room', 'SALA_E2E',
        'Sala de demonstração E2E', 'active'
      )
      on conflict (id) do update set
        name = excluded.name,
        status = 'active',
        updated_at = now()
    `;

    await tx`
      insert into public.appointments (
        id, tenant_id, clinic_unit_id, referral_id, resource_id,
        starts_at, ends_at, status, preparation_instructions
      ) values (
        ${appointmentId}, ${tenantId}, ${unitId}, ${referralId}, ${resourceId},
        date_trunc('day', now() at time zone 'America/Fortaleza') + interval '9 hours',
        date_trunc('day', now() at time zone 'America/Fortaleza') + interval '9 hours 30 minutes',
        'scheduled', 'Cenário estritamente fictício; não usar para orientação clínica.'
      )
      on conflict (id) do update set
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        status = 'scheduled',
        preparation_instructions = excluded.preparation_instructions,
        updated_at = now()
    `;

    const sectorId = "d2100000-0000-4000-8000-000000000001";
    const jobId = "d2200000-0000-4000-8000-000000000001";
    const gheId = "d2300000-0000-4000-8000-000000000001";
    const riskId = "d2400000-0000-4000-8000-000000000001";
    const protocolId = "d2500000-0000-4000-8000-000000000001";
    const protocolItemId = "d2600000-0000-4000-8000-000000000001";
    const credentialId = "d2700000-0000-4000-8000-000000000001";
    const conclusionRuleId = "d2800000-0000-4000-8000-000000000001";
    const panelId = "d2900000-0000-4000-8000-000000000001";
    const deviceToken = "e2e-public-display-token-ficticio-001";

    await tx`
      insert into public.sectors (id, tenant_id, company_id, code, name, status)
      values (${sectorId}, ${tenantId}, ${companyId}, 'SETOR_E2E', 'Setor E2E Fictício', 'active')
      on conflict (id) do update set status = 'active', name = excluded.name
    `;

    await tx`
      insert into public.job_positions (id, tenant_id, company_id, sector_id, code, name, status)
      values (${jobId}, ${tenantId}, ${companyId}, ${sectorId}, 'FUNCAO_E2E', 'Função E2E Fictícia', 'active')
      on conflict (id) do update set status = 'active', name = excluded.name
    `;

    await tx`
      insert into public.exposure_groups (id, tenant_id, company_id, code, name, status)
      values (${gheId}, ${tenantId}, ${companyId}, 'GHE_E2E', 'GHE E2E Fictício', 'active')
      on conflict (id) do update set status = 'active', name = excluded.name
    `;

    await tx`
      insert into public.occupational_risks (id, tenant_id, code, name, risk_type, status)
      values (${riskId}, ${tenantId}, 'RISCO_E2E', 'Risco fictício E2E', 'physical', 'active')
      on conflict (id) do update set status = 'active', name = excluded.name
    `;

    await tx`
      insert into public.risk_assignments (
        id, tenant_id, company_id, exposure_group_id, job_position_id, occupational_risk_id, source, starts_on
      ) values (
        'd2410000-0000-4000-8000-000000000001', ${tenantId}, ${companyId}, ${gheId}, ${jobId}, ${riskId},
        'pcmso', current_date - 30
      )
      on conflict (id) do nothing
    `;

    await tx`
      update public.employment_contracts
      set sector_id = ${sectorId},
          job_position_id = ${jobId},
          exposure_group_id = ${gheId},
          updated_at = now()
      where id = ${employmentId}
    `;

    await tx`
      insert into public.exam_protocols (
        id, tenant_id, pcmso_version_id, occupational_exam_type, rule_version, status
      ) values (
        ${protocolId}, ${tenantId}, ${pcmsoVersionId}, 'periodic', 1, 'approved'
      )
      on conflict (id) do update set status = 'approved', updated_at = now()
    `;

    await tx`
      insert into public.exam_protocol_items (
        id, tenant_id, exam_protocol_id, exam_catalog_id, required
      ) values (
        ${protocolItemId}, ${tenantId}, ${protocolId}, ${examCatalogId}, true
      )
      on conflict (id) do nothing
    `;

    await tx`
      insert into public.clinical_professional_credentials (
        id, tenant_id, user_id, clinic_unit_id, professional_role,
        council_code, council_region, registration_number, status
      ) values (
        ${credentialId}, ${tenantId}, ${userId}, ${unitId}, 'physician',
        'CRM', 'SP', '000000', 'active'
      )
      on conflict (id) do update set status = 'active', updated_at = now()
    `;

    await tx`
      insert into public.medical_conclusion_rules (
        id, tenant_id, code, name, status,
        block_when_no_closed_triage, block_when_no_closed_consultation,
        block_when_pending_required_exams, block_when_flow_paused
      ) values (
        ${conclusionRuleId}, ${tenantId}, 'DEFAULT_E2E', 'Regra E2E fictícia', 'active',
        true, true, true, true
      )
      on conflict (id) do update set status = 'active', name = excluded.name
    `;

    await tx`
      insert into public.display_panels (
        id, tenant_id, clinic_unit_id, code, name, channel_name, status, device_token_hash
      ) values (
        ${panelId}, ${tenantId}, ${unitId}, 'PAINEL_E2E', 'Painel E2E',
        'display:e2e:private', 'active', encode(digest(${deviceToken}, 'sha256'), 'hex')
      )
      on conflict (id) do update set
        status = 'active',
        device_token_hash = encode(digest(${deviceToken}, 'sha256'), 'hex'),
        updated_at = now()
    `;
  });

  console.log("Authenticated E2E seed and fictitious operational scenario are ready.");
  console.log("Public panel token (fictitious): e2e-public-display-token-ficticio-001");
} finally {
  await sql.end({ timeout: 5 });
}
