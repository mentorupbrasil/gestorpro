-- SUPERSEDED by 202607140028_p0_rpc_execute_allowlist.sql
-- Histórico: esta migration originalmente concedia EXECUTE a todas as funções
-- SECURITY DEFINER. Em bancos novos ela NÃO deve reabrir o buraco — a allowlist
-- em 028 é a fonte da verdade. Mantida como no-op documentado para preservar
-- o histórico de migrations já aplicadas.

begin;

do $$
begin
  raise notice '202607140004 superseded: RPC grants now owned by 202607140028 allowlist';
end;
$$;

commit;
