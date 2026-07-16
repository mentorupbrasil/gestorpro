-- Timezone da unidade (agenda): default America/Fortaleza.

begin;

alter table public.clinic_units
  add column if not exists timezone text not null default 'America/Fortaleza';

comment on column public.clinic_units.timezone is
  'IANA timezone da unidade; horários de agenda interpretados neste fuso e gravados em UTC.';

commit;
