# Status mestre

Atualizado em: 2026-07-16

## Estado

- Branch: `feat/p0-security-rpc-checkin` — PR #12 OPEN.
- Migrations `037`–`040` **aplicadas** no Postgres de teste autorizado.
- Gates locais: format/lint/typecheck/types/secrets/test(163) verdes neste ciclo; build validado.
- Produção / merge `main`: **NO-GO**.

| Fase                        | Estado        | Observação                                          |
| --------------------------- | ------------- | --------------------------------------------------- |
| CI quality                  | IN_PROGRESS   | aguardar verde após push                            |
| Autorização etapas          | P0_DB_APPLIED | sem fallback `encounters.manage`                    |
| ASO / billing               | P0_CODE       | PDF snapshot + derive catálogo                      |
| Bootstrap                   | P0_DB_APPLIED | admin-only, drafts, sem self-grant                  |
| Exames paralelos            | P0_DB_APPLIED | M2M `encounter_step_dependencies`                   |
| Painel P1 hardening         | P1_DB_APPLIED | redirect/versão/ACK fail-closed/revoke (`040`)      |
| Motor PCMSO negativos       | P0_CODE       | expired/ambíguo/demissional/retorno + hash          |
| Ops / health                | P1_PARTIAL    | `/app/operations` + health `?deep=1`                |
| Estações UI                 | P0_PARTIAL    | hide por permissão + cockpit                        |
| E2E ponta a ponta 40 passos | OPEN          | specs autenticados existem; close profundo pendente |
| Portal empresa              | P1_SCAFFOLD   | sem portal trabalhador                              |
| SST / eSocial               | P1_SCAFFOLD   | sandbox/incidentes; sem envio real                  |
| Backup restore validado     | OPEN          | doc RPO/RTO; CI restore ainda não                   |

**Decisão:** `NO-GO` produção.
