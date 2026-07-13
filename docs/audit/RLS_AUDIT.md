# Auditoria de RLS e grants

## Estado encontrado

Todas as tabelas de negócio declaravam RLS, porém policies de escrita usavam majoritariamente `has_tenant_permission`. Como essa função não distinguia escopo de unidade e o projeto Supabase costuma conceder DML a `authenticated`, era possível contornar AAL2, serviço e auditoria.

## Correção da Fase A

1. Permissão tenant-wide exige `membership_roles.clinic_unit_id IS NULL`.
2. Permissão de unidade é avaliada por função separada.
3. Policies não-`SELECT` foram removidas pela migration de hardening.
4. `INSERT`, `UPDATE` e `DELETE` foram revogados de `anon` e `authenticated` em todas as tabelas públicas e nos defaults futuros.
5. RPCs `security definer` mutacionais anteriores foram revogadas de `authenticated`, exceto as duas administrativas reescritas.

## Testes exigidos no banco

- DML direto em `clinic_units`, memberships, papéis e tabela clínica deve retornar `42501`/permission denied;
- chamada RPC em AAL1 deve falhar antes da mutação;
- papel de unidade A não deve autorizar tenant ou unidade B;
- membership bloqueada deve perder leitura imediatamente;
- auditoria deve existir na mesma transação de toda RPC reaberta;
- `anon` não deve possuir DML nem execução de RPC mutacional.

Estado: correção versionada e coberta por regressão estática; execução PostgreSQL real pendente.
