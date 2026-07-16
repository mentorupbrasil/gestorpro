-- P0: remove acesso clínico automático do tenant_admin e cria papéis
-- operacionais separados com permissões mínimas.

begin;

-- 1) Papéis de sistema
insert into public.roles (id, tenant_id, code, name, is_system)
select gen_random_uuid(), null, code, name, true
from (values
  ('unit_manager', 'Gestor de unidade'),
  ('receptionist', 'Recepcionista'),
  ('nursing', 'Enfermagem'),
  ('nursing_technician', 'Técnico de enfermagem'),
  ('occupational_physician', 'Médico ocupacional'),
  ('exam_technician', 'Técnico de exame'),
  ('speech_therapist', 'Fonoaudiólogo'),
  ('laboratory', 'Laboratório'),
  ('document_operator', 'Operador documental'),
  ('finance', 'Financeiro'),
  ('auditor', 'Auditor'),
  ('company_user', 'Usuário empresarial'),
  ('restricted_support', 'Suporte restrito')
) as roles(code, name)
where not exists (
  select 1 from public.roles existing
  where existing.tenant_id is null and existing.code = roles.code
);

-- 2) Revoga permissões clínicas/operacionais do tenant_admin
delete from public.role_permissions
where role_id in (
  select id from public.roles where tenant_id is null and code = 'tenant_admin'
)
and permission_id in (
  select id from public.permissions
  where code in (
    'clinical.read',
    'triage.manage',
    'consultations.manage',
    'conclusions.manage',
    'clinical.reopen',
    'exams.read',
    'exams.manage',
    'documents.read',
    'documents.manage',
    'documents.sign',
    'documents.deliver',
    'encounters.read',
    'encounters.manage',
    'queues.read',
    'queues.manage',
    'display.read',
    'display.manage',
    'referrals.read',
    'referrals.manage',
    'schedule.read',
    'schedule.manage',
    'imports.manage',
    'occupational.read',
    'occupational.manage',
    'protocols.read',
    'protocols.manage',
    'pricing.read',
    'pricing.manage',
    'finance.read',
    'finance.manage',
    'company_portal.read',
    'company_portal.manage',
    'integrations.read',
    'integrations.manage',
    'esocial.read',
    'esocial.manage',
    'sst.read',
    'sst.manage',
    'messages.read',
    'messages.manage',
    'equipment.read',
    'equipment.manage'
  )
);

-- tenant_admin permanece administrativo
insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'tenant_admin'
  and permission.code in (
    'tenant.read',
    'tenant.manage',
    'units.read',
    'units.manage',
    'memberships.read',
    'memberships.manage',
    'roles.read',
    'roles.manage',
    'audit.read'
  )
on conflict do nothing;

-- 3) Matriz mínima por papel
insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'unit_manager'
  and permission.code in (
    'units.read',
    'memberships.read',
    'occupational.read',
    'occupational.manage',
    'protocols.read',
    'referrals.read',
    'referrals.manage',
    'schedule.read',
    'schedule.manage',
    'encounters.read',
    'encounters.manage',
    'queues.read',
    'queues.manage',
    'display.read',
    'display.manage',
    'audit.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'receptionist'
  and permission.code in (
    'referrals.read',
    'schedule.read',
    'schedule.manage',
    'encounters.read',
    'encounters.manage',
    'queues.read',
    'queues.manage',
    'display.read',
    'occupational.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'nursing'
  and permission.code in (
    'clinical.read',
    'triage.manage',
    'encounters.read',
    'queues.read',
    'queues.manage',
    'exams.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'nursing_technician'
  and permission.code in (
    'clinical.read',
    'triage.manage',
    'encounters.read',
    'queues.read',
    'exams.read',
    'exams.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'occupational_physician'
  and permission.code in (
    'clinical.read',
    'consultations.manage',
    'conclusions.manage',
    'clinical.reopen',
    'encounters.read',
    'queues.read',
    'queues.manage',
    'exams.read',
    'documents.read',
    'documents.sign'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'exam_technician'
  and permission.code in (
    'exams.read',
    'exams.manage',
    'encounters.read',
    'queues.read',
    'queues.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'speech_therapist'
  and permission.code in (
    'exams.read',
    'exams.manage',
    'encounters.read',
    'queues.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'laboratory'
  and permission.code in (
    'exams.read',
    'exams.manage',
    'encounters.read',
    'queues.read',
    'queues.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'document_operator'
  and permission.code in (
    'documents.read',
    'documents.manage',
    'documents.deliver',
    'encounters.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'finance'
  and permission.code in (
    'finance.read',
    'finance.manage',
    'pricing.read',
    'pricing.manage',
    'encounters.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'auditor'
  and permission.code in (
    'audit.read',
    'tenant.read',
    'occupational.read',
    'protocols.read',
    'referrals.read',
    'schedule.read',
    'encounters.read',
    'clinical.read',
    'exams.read',
    'documents.read',
    'finance.read'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'company_user'
  and permission.code in (
    'company_portal.read',
    'company_portal.manage'
  )
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
cross join public.permissions permission
where role.tenant_id is null
  and role.code = 'restricted_support'
  and permission.code in (
    'tenant.read',
    'units.read',
    'memberships.read'
  )
on conflict do nothing;

commit;
