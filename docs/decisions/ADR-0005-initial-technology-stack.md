# ADR-0005 — Stack técnica inicial

**Status:** PROPOSTA

## Decisão proposta

Next.js/React/TypeScript strict, Supabase Auth/Postgres/RLS/Storage/Realtime, Drizzle, Zod, Vitest, Playwright e GitHub Actions. Workflows, Redis e observabilidade externa entram somente quando sua necessidade aparecer.

## Alternativas e riscos

PostgreSQL e SQL permanecem portáveis; Auth/Realtime/Storage geram lock-in moderado. Serviços opcionais não devem entrar por antecipação. Versões, compatibilidade, custos e regiões serão confirmados em documentação oficial antes da instalação na Fase 1.
