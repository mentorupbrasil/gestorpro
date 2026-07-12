# Bloqueios

## Fase 1 — validação de banco

- Docker e Supabase CLI não estão disponíveis; typegen oficial via CLI e ambiente local descartável continuam indisponíveis.
- Em 2026-07-12, um projeto Supabase de teste autorizado foi validado via Session Pooler: migration aplicada, RLS real testado, isolamento tenant A/B confirmado, membership bloqueada perde acesso e auditoria append-only bloqueia mutação.

O bloqueio de banco/RLS real foi removido. A Fase 1 ainda não pode ser aceita tecnicamente enquanto MFA/AAL2 real, E2E autenticado e geração de tipos Supabase permanecerem pendentes.
