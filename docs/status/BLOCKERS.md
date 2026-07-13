# Bloqueios

## Fase A — governança remota

- O repositório público permanece bloqueio de produção e exige ação humana para torná-lo privado e revisar acessos, apps, chaves, tokens, webhooks, Vercel, Supabase e histórico de segredos.
- O cliente `gh` e um conector GitHub autenticado não estão disponíveis nesta sessão. PR e CI podem ser inventariados pelas evidências locais/públicas acessíveis, mas converter PR em draft ou atualizar sua descrição exige ferramenta autenticada.

## P0.1 — triagem operacional

- `.env` local ausente; variáveis `MIGRATION_DATABASE_URL` / `PGHOST`+`PGPASSWORD` não definidas. Migration `202607140002_triage_operational_hardening.sql` e checklist manual bloqueados até credenciais do Supabase autorizado.
- Comando preparado: `pnpm migrate:triage` (após configurar `.env`).

## Fase A — typegen e PostgreSQL

- Supabase CLI `2.109.1` está instalada e fixada no projeto. O typegen oficial ainda requer `SUPABASE_PROJECT_ID` e `SUPABASE_ACCESS_TOKEN` temporários para um projeto autorizado com todas as migrations aplicadas.
- Docker/PostgreSQL local continuam indisponíveis; a migration de hardening e os testes de bypass não puderam ser executados em banco real nesta sessão.
- Em 2026-07-12, um projeto Supabase de teste autorizado foi validado via Session Pooler: migration aplicada, RLS real testado, isolamento tenant A/B confirmado, membership bloqueada perde acesso e auditoria append-only bloqueia mutação.
- Em 2026-07-12, MFA/TOTP e E2E autenticado real foram validados no mesmo ambiente Supabase autorizado.

Os bloqueios de banco/RLS real, MFA/AAL2 e E2E autenticado foram removidos apenas para o checkpoint antigo. A Fase A não pode ser aceita enquanto typegen, hardening/RLS real, integridade composta e E2E autenticado da nova base permanecerem pendentes.

## Fase A — integridade multi-tenant

- As FKs atuais são predominantemente simples por `id`. Constraints compostas exigem aplicação/validação em banco descartável para não introduzir migration que falhe sobre dados existentes desconhecidos.
