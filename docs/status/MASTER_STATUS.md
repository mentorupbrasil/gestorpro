# Status mestre

Atualizado em: 2026-07-16

## Estado

- Branch: `feat/p0-security-rpc-checkin` — PR #12 OPEN.
- Commits P0 deste ciclo: `1735f53`, `b3c6ecf`, `4af4919`.
- Migrations `037`–`039` **aplicadas** no Postgres de teste autorizado.
- Gates locais: format/lint/typecheck/types/secrets/audit/test(157)/build verdes na última validação.
- Produção / merge `main`: **NO-GO**.

| Fase                           | Estado        | Observação                                        |
| ------------------------------ | ------------- | ------------------------------------------------- |
| CI quality                     | IN_PROGRESS   | remoto reexecutando após fix CI                   |
| Autorização etapas             | P0_DB_APPLIED | sem fallback `encounters.manage`                  |
| ASO / billing                  | P0_CODE       | PDF snapshot + derive catálogo                    |
| Bootstrap                      | P0_DB_APPLIED | admin-only, drafts, sem self-grant                |
| Exames paralelos               | P0_DB_APPLIED | M2M `encounter_step_dependencies`                 |
| Estações UI                    | P0_PARTIAL    | hide por permissão + cockpit                      |
| E2E ponta a ponta 40 passos    | OPEN          | ainda navegação/estações; close profundo pendente |
| Portal / SST / eSocial / carga | OPEN          | P1                                                |

**Decisão:** `NO-GO` produção.
