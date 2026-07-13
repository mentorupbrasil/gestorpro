# Bloqueios

## Fase A — governança remota

- O repositório público permanece bloqueio de produção e exige ação humana para torná-lo privado e revisar acessos, apps, chaves, tokens, webhooks, Vercel, Supabase e histórico de segredos.
- O cliente `gh` e um conector GitHub autenticado não estão disponíveis nesta sessão. PR e CI podem ser inventariados pelas evidências locais/públicas acessíveis, mas converter PR em draft ou atualizar sua descrição exige ferramenta autenticada.

## P0.1 — triagem operacional

- Migration `202607140002` aplicada no Supabase autorizado (2026-07-13).
- Checklist UI manual ainda pendente (`pnpm dev`).

## P0.2 — consulta operacional

- Migration `202607140003` aplicada no Supabase autorizado (2026-07-13).
- Checklist UI manual pendente.

## P0.3 — conclusão operacional

- Código e testes unitários entregues (2026-07-13).
- Migration `202607140004_grant_operational_rpcs.sql` aplicada.
- Checklist UI manual pendente (`/app/clinical?conclusion=<encounter_id>` + MFA).

## Fase A — typegen e PostgreSQL
- Docker/PostgreSQL local continuam indisponíveis; a migration de hardening e os testes de bypass não puderam ser executados em banco real nesta sessão.
- Em 2026-07-12, um projeto Supabase de teste autorizado foi validado via Session Pooler: migration aplicada, RLS real testado, isolamento tenant A/B confirmado, membership bloqueada perde acesso e auditoria append-only bloqueia mutação.
- Em 2026-07-12, MFA/TOTP e E2E autenticado real foram validados no mesmo ambiente Supabase autorizado.

Os bloqueios de banco/RLS real, MFA/AAL2 e E2E autenticado foram removidos apenas para o checkpoint antigo. A Fase A não pode ser aceita enquanto typegen, hardening/RLS real, integridade composta e E2E autenticado da nova base permanecerem pendentes.

## Fase A — integridade multi-tenant

- As FKs atuais são predominantemente simples por `id`. Constraints compostas exigem aplicação/validação em banco descartável para não introduzir migration que falhe sobre dados existentes desconhecidos.
