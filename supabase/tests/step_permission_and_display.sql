begin;

select plan(6);

select ok(
  exists (
    select 1 from public.permissions where code = 'triage.manage'
  )
  and exists (
    select 1 from public.permissions where code = 'encounters.manage'
  ),
  'clinical and reception permissions exist'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'transition_encounter_step'
  ),
  'transition_encounter_step exists'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'encounter_step_dependencies'
      and column_name = 'depends_on_step_id'
  ),
  'parallel dependency table exists'
);

select ok(
  pg_get_functiondef('public.create_call_event(uuid,uuid,uuid,text,text,int,uuid)'::regprocedure)
    like '%redirect destination required%',
  'create_call_event requires redirect destination'
);

select ok(
  pg_get_functiondef('public.acknowledge_call_delivery(text,uuid,uuid,text)'::regprocedure)
    like '%call delivery not found%',
  'acknowledge_call_delivery fails closed when delivery missing'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'revoke_display_panel'
  ),
  'revoke_display_panel exists'
);

select * from finish();
rollback;
