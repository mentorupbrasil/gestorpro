# Estratégia de testes

## Pirâmide e ambientes

- Unitários: regras puras, permissões e máquinas de estado com Vitest.
- Integração: casos de uso, transações e repositórios contra PostgreSQL/Supabase descartável.
- RLS/segurança: SQL e API com sessões de papéis/tenants distintos.
- E2E: Playwright em preview/staging com dados sintéticos.
- Contrato: DTOs, webhooks, workflows e payloads versionados.

## Gates por alteração

Formatação, lint, TypeScript estrito, unitários, integração aplicável, migration do zero, build e scanner de segredos. Fluxos críticos acrescentam concorrência, idempotência, RLS e E2E negativo.

## Casos invariantes

Tenant A/B, rota sem sessão, permissão insuficiente, duplo clique, concorrência, rollback intermediário, versão divergente 409, protocolo ausente, documento duplicado, URL expirada, Storage/Realtime indisponível e logs sem conteúdo sensível.

## Evidências

Comandos, versão do ambiente, resultado e falhas ficam em `docs/status/TEST_RESULTS.md`. Testes não podem ser silenciados com `skip`, `only` ou remoção de asserções.
