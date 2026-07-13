# Bloqueios

## Fase A — governança remota

- Repositório `mentorupbrasil/gestorpro` tornado **private** em 2026-07-13 via `gh` (conta `mentorupbrasil`).
- Colaboradores inventariados: apenas `mentorupbrasil` (admin). Webhooks de repositório: nenhum.
- Pendente: rotação do `SUPABASE_ACCESS_TOKEN` vazado no chat; revisão Vercel (deploys Production/Preview existentes).
- Pedido de GO formal de produção do dono (2026-07-13): registrado; **deploy/dados reais/merge de produção** continuam NO-GO até auditoria fechar acessos/chaves + gates restantes.

## P0.1–P0.3 — clínica operacional

- Checklists UI manuais **fechados** em 2026-07-13 com MFA/AAL2 no Tenant E2E.

## Fase A — typegen e PostgreSQL

- Typegen oficial remoto **fechado**; regenerado após P0.4; `types:supabase:check` OK.
- **Rotacionar o access token** no dashboard Supabase (foi colado no chat).

## Fase A — integridade multi-tenant

- **Lote clínico P0.4 fechado** em 2026-07-13 no banco autorizado:
  - preflight sem mismatches;
  - dry-run + apply de `202607140007_p0_4_composite_tenant_fks_clinical.sql`;
  - negativo: update cruzado `encounters.worker_id` bloqueado por `encounters_worker_tenant_fk`.
- Pendente: ondas empresa/agenda/exames/financeiro (ainda FKs simples nessas áreas).
