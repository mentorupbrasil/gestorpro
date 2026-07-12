# ADR-0002 — Multitenancy em schema compartilhado

**Status:** PROPOSTA

## Decisão

Usar PostgreSQL compartilhado com `tenant_id`, autorização server-side e RLS. Tabelas globais serão exceções explícitas.

## Consequências

Operação simples e econômica, porém qualquer falha de política é crítica; testes de isolamento e índices tenant-first são gates obrigatórios.
