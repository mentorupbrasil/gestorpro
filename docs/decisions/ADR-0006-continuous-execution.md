# ADR-0006 — Continuidade entre fases

**Status:** PROPOSTA

## Contexto

O guia original manda parar e aguardar autorização entre fases. O briefing executivo de 12/07/2026 autoriza prosseguir automaticamente quando critérios técnicos passam e não há risco ou validação humana.

## Decisão

Tratar a instrução mais recente e específica como autorização de continuidade. Permanecem proibidos deploy/produção, merge em `main`, ações irreversíveis, credenciais inventadas e decisões clínicas, jurídicas ou regulatórias.
