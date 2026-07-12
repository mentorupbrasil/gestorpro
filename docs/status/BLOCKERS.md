# Bloqueios

## Fase 1 — ambiente local

- Docker e Supabase CLI não estão disponíveis; testes reais de RLS/migrations Supabase ficam bloqueados até existir runtime local descartável ou ambiente de teste autorizado.
- Lockfile e dependências foram instalados. Como o OneDrive bloqueia executáveis no sandbox, os gates precisam de execução aprovada fora dele; a cota de aprovações da conta ficou temporariamente indisponível até 06:29.
- `server-only` foi adicionado depois do lockfile atual e exige atualização antes dos gates.

Os bloqueios são parciais: implementação offline pode continuar, mas a Fase 1 não pode ser aceita sem lock atualizado, build, testes reais e validação RLS.
