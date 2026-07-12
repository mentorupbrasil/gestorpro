# ADR-0003 — Estado durável, outbox e Realtime

**Status:** PROPOSTA

## Decisão

PostgreSQL é fonte oficial. Efeitos externos usam outbox após commit; Realtime é transporte reconciliável e Redis apenas temporário.

## Consequências

Evita sucesso fantasma e perda silenciosa, ao custo de workers, idempotência e observabilidade operacional.
