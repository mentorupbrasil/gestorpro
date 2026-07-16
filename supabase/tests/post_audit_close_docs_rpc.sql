begin;

select plan(6);

-- Transition source must not auto-complete encounters (041 rewrite).
select ok(
  position('NEVER mark encounter completed here' in pg_get_functiondef('public.transition_encounter_step(uuid,uuid,text,text,int,text,text)'::regprocedure)) > 0,
  'transition_encounter_step documents no auto-complete'
);

select ok(
  position('set status = ''completed''' in pg_get_functiondef('public.transition_encounter_step(uuid,uuid,text,text,int,text,text)'::regprocedure)) = 0,
  'transition_encounter_step does not set encounters.completed'
);

select ok(
  exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'encounter_closures'
  ),
  'encounter_closures table exists'
);

select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_encounter_close_readiness'
  ),
  'get_encounter_close_readiness exists'
);

select ok(
  not exists (
    select 1 from public.rpc_execute_inventory
    where function_name = 'finalize_document_version_render'
      and (grant_authenticated or grant_anon or grant_public)
  ),
  'finalize_document_version_render is not publicly executable'
);

select lives_ok(
  $$ select public.assert_canonical_public_rpc_overloads() $$,
  'canonical RPC overload assert passes'
);

select * from finish();
rollback;
