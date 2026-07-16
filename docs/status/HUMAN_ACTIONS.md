# Ações humanas obrigatórias (não automatizar)

Estas ações ficam fora do agente de código. Sem elas a decisão permanece **NO-GO**.

## Segurança / exposição

1. Confirmar se o repositório está **privado** no GitHub (screenshot local recente ainda pode mostrar Public).
2. Revogar e recriar `SUPABASE_ACCESS_TOKEN` se já foi exposto.
3. Revisar variáveis Production / Preview / Development na Vercel.
4. Revisar chaves Supabase, webhooks, deploy keys e GitHub Apps.

## Secrets CI (authenticated-e2e)

Configurar no GitHub Actions (environment/secrets), senão o job **falha de propósito**:

- `E2E_AUTH_ENABLED=1`
- `E2E_AUTH_EMAIL` / `E2E_AUTH_PASSWORD` / `E2E_TOTP_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` (não placeholder)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`

## Banco de teste

1. Aplicar migration `041` no Postgres de teste já com `037`–`040`.
2. Registrar evidência de `migrate:fresh` e `migrate:upgrade` em `TEST_RESULTS.md`.

## Proteção da `main` (Settings → Branches → Branch protection)

Ativar manualmente:

- exigir PR (sem push direto);
- PR não draft para merge;
- status checks obrigatórios: CI quality, ui-smoke, db-migrations-fresh, CodeQL, Dependency Review;
- branch atualizada antes do merge;
- conversas resolvidas;
- ≥1 revisão humana;
- bloquear force push e exclusão da `main`.

Ambiente Production: aprovação manual antes de deploy.

## Não misturar com implementação

Rotação de token / Vercel / branch protection **não** bloqueiam continuar código na feature branch; bloqueiam apenas qualquer GO de produção.
