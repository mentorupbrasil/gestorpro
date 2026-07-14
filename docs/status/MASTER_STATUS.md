# Status mestre

Atualizado em: 2026-07-13

## Reauditoria V2

- Fase A — Reauditoria e correção da fundação: `PARTIAL / IN_PROGRESS`.
- Produção e merge na `main`: não autorizados.
- Fechado tecnicamente nesta linha: contenção DML/RPC, escopo por recurso, AAL2 no banco, typegen oficial, P0.1–P0.3 operacionais, FKs compostas ondas 1–3, **P0.5 papéis + P0.6 leitura sensível (código)**.
- Gate A ainda aberto: checks remotos da PR #11 a confirmar; typegen pós-`012`; auth unit-scoped em exames/agenda residual; ações humanas (`HUMAN_ACTIONS.md`).
- Correção urgente desta unidade: gate clínico unit-scoped (`requireTenantOrUnitPermission`) + remoção de `supabase/.temp` do Git.

| Fase                         | Estado                | Observação                                        |
| ---------------------------- | --------------------- | ------------------------------------------------- |
| 0 — Fundação documental      | TECHNICALLY_COMPLETED | auditoria aprovada; ADRs permanecem PROPOSTA      |
| 1 — Plataforma e segurança   | REAUDIT_IN_PROGRESS   | P0.5 no repo; validação DB pendente               |
| 2 — Domínio ocupacional      | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                |
| 3 — Encaminhamentos e agenda | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                |
| 4 — Check-in, etapas e filas | CHECKPOINT_PUBLISHED  | Fase F `016` aplicada/commitada                   |
| 5 — Painel de chamadas       | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                |
| 6 — Triagem e consulta       | CHECKPOINT_IN_PROGRESS | Fase G: `017` alertas/adendo/pausa (apply dono)  |
| 7 — Exames complementares    | CHECKPOINT_IN_PROGRESS | Fase H: wire diagnóstico+lab UI                   |
| 8 — Documentos               | CHECKPOINT_IN_PROGRESS | Fase I: `018` + generate/sign UI (apply dono)     |
| 9 — Financeiro e portal      | CHECKPOINT_PUBLISHED  | validação contábil/jurídica futura                |
| 10 — Integrações             | CHECKPOINT_PUBLISHED  | eSocial oficial consultado; sem envio real        |
| 11 — Produção e piloto       | CHECKPOINT_PUBLISHED  | relatório NO-GO; sem GO de produção               |

Branch de trabalho: `feat/p0-2-consulta-operacional`. PR draft: https://github.com/mentorupbrasil/gestorpro/pull/11
