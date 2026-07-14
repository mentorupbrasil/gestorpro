# Status mestre

Atualizado em: 2026-07-14

## Reauditoria V2

- Fase A — Reauditoria e correção da fundação: `PARTIAL / IN_PROGRESS`.
- Produção e merge na `main`: não autorizados.
- **Branch atual:** `feat/p0-security-rpc-checkin`.
- P0 DB aplicado (`028`–`031`); P1 transição/chamadas/display (`032`) aplicado.
- Checkpoints antigos **não** equivalem a produto operacional completo.

| Fase                       | Estado        | Observação                                     |
| -------------------------- | ------------- | ---------------------------------------------- |
| 1 — Plataforma e segurança | P0_DB_APPLIED | allowlist + papéis; negativos RPC passed       |
| 3 — Agenda                 | P0_DB_APPLIED | timezone app + guards `031`                    |
| 4 — Check-in / filas       | P0_DB_APPLIED | `029` + recepção tabela/drawer                 |
| 5 — Painel chamadas        | P1_PARTIAL    | `create_call_event` endurecido; painel público |
| 6 — Clínica                | P1_PARTIAL    | estações em rotas separadas                    |
| 7–11                       | OPEN          | E2E integral e GO humanos pendentes            |

NO-GO produção.
