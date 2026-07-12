# Bloqueios

## Fase 1 — validação de banco

- Docker e Supabase CLI não estão disponíveis; testes reais de migrations, RLS, tenant A/B autenticado e auditoria no PostgreSQL/Supabase ficam bloqueados até existir runtime local descartável ou ambiente de teste autorizado.

O bloqueio é parcial: aplicação, unitários, E2E sem sessão, build e CI podem continuar, mas a Fase 1 não pode ser aceita tecnicamente sem executar a migration e a suíte RLS real.
