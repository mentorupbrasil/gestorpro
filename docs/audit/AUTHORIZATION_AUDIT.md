# Auditoria de autorização

## Achados críticos

| ID      | Severidade | Evidência                                                           | Tratamento                                                                             |
| ------- | ---------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| AUTH-01 | crítico    | `has_tenant_permission` considerava papéis com `clinic_unit_id`     | função substituída; somente papel sem unidade concede permissão tenant-wide            |
| AUTH-02 | crítico    | AAL2 era validado na aplicação, mas não nas RPCs administrativas    | `create_clinic_unit` e `set_membership_status` agora validam `auth.jwt().aal` no banco |
| AUTH-03 | crítico    | policies permitiam DML direto sem auditoria transacional            | DML de `anon`/`authenticated` revogado; policies de escrita removidas                  |
| AUTH-04 | alto       | RPCs históricas mutacionais não foram todas reauditadas por recurso | execução autenticada congelada até hardening individual                                |
| AUTH-05 | alto       | último administrador podia ser bloqueado por outro administrador    | contagem transacional e bloqueio do último admin ativo adicionados                     |
| AUTH-06 | alto       | contexto da aplicação misturava permissão tenant e unidade          | `unitPermissions` separado e `requireUnitPermission` criado                            |

## Modelo após a contenção

- `requirePermission` aceita somente permissão tenant-wide.
- `requireUnitPermission` aceita permissão tenant-wide ou concessão na unidade solicitada.
- o banco oferece `has_tenant_permission`, `has_unit_permission`, `has_company_permission`, `has_professional_permission`, `has_encounter_permission` e `has_document_permission`.
- IDs recebidos são referências; cada função carrega o recurso no banco e deriva tenant/unidade.
- mutações não reauditadas falham fechadas.

## Pendências

- reabrir cada RPC congelada somente com AAL2 quando crítico, autorização pelo recurso real, auditoria na mesma transação e teste negativo;
- aplicar e validar no banco autorizado a migration `202607140010` (`assign_membership_role` / `revoke_membership_role`);
- confirmar revogação global de sessões (`auth.admin.signOut` global) no ambiente autorizado após bloqueio;
- implementar P0.6 leituras auditadas; break-glass completo antes de qualquer acesso clínico emergencial.
