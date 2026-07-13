begin;

do $$
declare
  routine record;
begin
  for routine in
    select proc.proname as function_name,
      pg_catalog.pg_get_function_identity_arguments(proc.oid) as arguments
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace on namespace.oid = proc.pronamespace
    where namespace.nspname = 'public'
      and proc.prosecdef
      and proc.proname <> all (array[
        'append_audit_log',
        'provision_tenant_for_user',
        'reject_snapshot_mutation',
        'reject_audit_mutation'
      ])
  loop
    execute format(
      'grant execute on function public.%I(%s) to authenticated',
      routine.function_name,
      routine.arguments
    );
  end loop;
end;
$$;

commit;
