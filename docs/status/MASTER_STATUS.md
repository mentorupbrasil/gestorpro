# Status mestre

Atualizado em: 2026-07-16 (pós-auditoria)

## Estado

- Branch: `feat/p0-security-rpc-checkin` — PR #12 OPEN (draft).
- Head de partida desta rodada: `7778240` (igual ao auditado).
- Migration `041` adicionada (não edita `037`–`040`).
- Gates locais deste ciclo: typecheck / lint / test(**166**) / types / secrets verdes; format corrigido.
- CI reestruturado: `quality`, `ui-smoke`, `db-migrations-fresh`, `db-migrations-upgrade`, `authenticated-e2e` (falha sem secrets — sem skip).
- Produção / merge `main`: **NO-GO**.

| Fase                        | Estado        | Observação                                               |
| --------------------------- | ------------- | -------------------------------------------------------- |
| CI quality                  | CODE_READY    | jobs separados; auth E2E exige secrets                   |
| Migrations fresh/upgrade    | CODE_READY    | script com modos; job CI com Postgres 16 + bootstrap     |
| Autorização etapas          | P0_DB_APPLIED | sem fallback `encounters.manage`                         |
| Close bypass                | P0_CODE_041   | transition não completa; `encounter_closures`            |
| Documentos fail-closed      | P0_CODE_041   | finalize `service_role` + storage verify                 |
| Close readiness UI          | P0_CODE       | RPC `get_encounter_close_readiness`; hardcodes removidos |
| ASO papéis                  | P0_CODE       | generate / sign / deliver separados                      |
| Bootstrap                   | P0_DB_APPLIED | admin-only                                               |
| Exames paralelos            | P0_DB_APPLIED | M2M deps; cancelled não satisfaz                         |
| Painel P1 hardening         | P1_DB_APPLIED | `040`                                                    |
| E2E ponta a ponta 40 passos | OPEN          | job autenticado falha sem secrets (intencional)          |
| Portal empresa              | P1_SCAFFOLD   | sem portal trabalhador                                   |
| SST / eSocial               | P1_SCAFFOLD   | sandbox                                                  |
| Backup restore validado     | OPEN          | doc RPO/RTO; evidência ainda não                         |

**Decisão:** `NO-GO` produção.
