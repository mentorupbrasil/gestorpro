# Bloqueios

## Fase 1 — typegen Supabase

- Docker e Supabase CLI não estão disponíveis; typegen oficial via CLI e ambiente local descartável continuam indisponíveis.
- Em 2026-07-12, um projeto Supabase de teste autorizado foi validado via Session Pooler: migration aplicada, RLS real testado, isolamento tenant A/B confirmado, membership bloqueada perde acesso e auditoria append-only bloqueia mutação.
- Em 2026-07-12, MFA/TOTP e E2E autenticado real foram validados no mesmo ambiente Supabase autorizado.

Os bloqueios de banco/RLS real, MFA/AAL2 e E2E autenticado foram removidos. A Fase 1 ainda não pode ser aceita tecnicamente enquanto a geração oficial de tipos Supabase permanecer pendente.
