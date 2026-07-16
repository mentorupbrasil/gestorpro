begin;

select plan(2);

-- Sem setup pesado: só valida que finalize exige aal2 e create rejeita sem contexto.
select throws_ok(
  $$select public.finalize_document_version_render(
    'e0000000-0000-4000-8000-000000000041',
    'e1000000-0000-4000-8000-000000000041',
    'rendered',
    'abc',
    'doc-finalize-no-auth'
  )$$,
  '42501',
  null,
  'finalize exige sessão autenticada/aal2'
);

select has_function(
  'public',
  'finalize_document_version_render',
  array['uuid', 'uuid', 'text', 'text', 'text'],
  'finalize_document_version_render existe'
);

select * from finish();
rollback;
