# Status mestre

Atualizado em: 2026-07-16

## Reauditoria V2 + lote P0 em andamento

- Branch: `feat/p0-security-rpc-checkin` — PR #12 OPEN.
- Gates locais do lote P0 (format/lint/typecheck/types/secrets/audit/test/scanner/build): **verdes**.
- Correções P0 aplicadas no código: permissões por etapa, ASO snapshot PDF, billing derivado, bootstrap admin-only, CI anti-stub.
- Ainda aberto: E2E ponta a ponta completo, DAG paralelo de exames, encerramento orquestrado RPC, apply DB humano, P1 portal/SST/eSocial.
- Produção / merge `main`: **NO-GO**.

| Fase                       | Estado         | Observação                                         |
| -------------------------- | -------------- | -------------------------------------------------- |
| 1 — Plataforma e segurança | P0_IN_PROGRESS | 037/038 no repo; apply DB pendente                 |
| 3 — Agenda                 | P0_DB_APPLIED  | timezone + guards                                  |
| 4 — Check-in / filas       | P0_PARTIAL     | check-in 029 existe; concorrência E2E pendente     |
| 5 — Painel chamadas        | P1_PARTIAL     | Realtime ok; lint board corrigido                  |
| 6 — Clínica                | P0_IN_PROGRESS | ASO real + permissões; E2E close profundo pendente |
| 7 — Exames                 | P2_PARTIAL     | filas; DAG paralelo pendente                       |
| 8–11                       | PARTIAL        | finance/portal endurecidos; GO humano              |

**Decisão:** `NO-GO` produção.
