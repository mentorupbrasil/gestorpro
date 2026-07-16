# Status mestre

Atualizado em: 2026-07-16

## Reauditoria V2

- Fase A — Reauditoria e correção da fundação: `PARTIAL / READY_FOR_HUMAN_GO`.
- Produção e merge na `main`: não autorizados (HUMAN_ACTIONS).
- **Branch atual:** `feat/p0-security-rpc-checkin`.
- P0–P3 engenharia na branch: check-in, clínica guiada (ASO/billing/close), painel Realtime, exames por fila, portal IDOR ampliado.

| Fase                       | Estado        | Observação                                     |
| -------------------------- | ------------- | ---------------------------------------------- |
| 1 — Plataforma e segurança | P0_DB_APPLIED | allowlist + papéis; negativos RPC passed       |
| 3 — Agenda                 | P0_DB_APPLIED | timezone app + guards `031`                    |
| 4 — Check-in / filas       | P0_DB_APPLIED | `029` + recepção tabela/drawer                 |
| 5 — Painel chamadas        | P1_READY      | Realtime + heartbeat + voz + poll fallback     |
| 6 — Clínica                | P1_READY      | estações + fechamento guiado ASO/billing       |
| 7 — Exames                 | P2_PARTIAL    | filas select; domínio RPC já existia           |
| 8–11                       | PARTIAL       | docs/finance/portal endurecidos; GO humano     |

NO-GO produção.
