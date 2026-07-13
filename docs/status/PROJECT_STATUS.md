# Compatibilidade — PROJECT_STATUS

O estado canônico está em [MASTER_STATUS.md](MASTER_STATUS.md), [CURRENT_PHASE.md](CURRENT_PHASE.md) e [GENERAL_AUDIT_20260713.md](GENERAL_AUDIT_20260713.md).

- Branch atual: `chore/fase-11-producao-piloto`.
- Fases 0–10: checkpoints técnicos publicados.
- Fase 11: checkpoint NO-GO publicado.
- Revisão geral pós-checkpoints: em andamento.
- Gates locais da revisão geral: `format:check`, `lint`, `typecheck`, unitários, build e E2E público/local passaram.
- Pendências principais: telas operacionais faltantes nas fases 7C–10, E2E ponta a ponta, validação SQL completa das migrations, typegen Supabase, carga/concorrência, backup/restore, acessibilidade e validações humanas.
- Produção: não autorizada.
