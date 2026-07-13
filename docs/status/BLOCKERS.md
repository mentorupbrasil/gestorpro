# Bloqueios

## Fase A — governança remota

- O repositório público permanece bloqueio de produção e exige ação humana para torná-lo privado e revisar acessos, apps, chaves, tokens, webhooks, Vercel, Supabase e histórico de segredos.
- O cliente `gh` e um conector GitHub autenticado não estão disponíveis nesta sessão. PR e CI podem ser inventariados pelas evidências locais/públicas acessíveis, mas converter PR em draft ou atualizar sua descrição exige ferramenta autenticada.

## P0.1 — triagem operacional

- Checklist UI manual **fechado** em 2026-07-13 com MFA/AAL2 no Tenant E2E.
- Correções aplicadas: alias `log_audit`, fix `queue_tickets.updated_at` inexistente.

## P0.2 — consulta operacional

- Checklist UI manual **fechado** em 2026-07-13 (SOAP + conclusão da consulta + MFA).

## P0.3 — conclusão operacional

- Checklist UI manual **fechado** em 2026-07-13 (`signature_status = prepared`).

## Fase A — typegen e PostgreSQL

- Typegen oficial remoto continua pendente: `SUPABASE_ACCESS_TOKEN` ausente no `.env`; `types:supabase:generate` caiu para offline.
- Testes negativos de bypass/RLS reexecutados no pooler autorizado (AAL1 bloqueado, outsider sem permissão, isolamento tenant B = 0, audit append-only).
- `validate-phase1-supabase.mjs` passou após correção de `request.jwt.claims` (AAL2).

## Fase A — integridade multi-tenant

- As FKs atuais são predominantemente simples por `id`. Constraints compostas exigem aplicação/validação em banco descartável para não introduzir migration que falhe sobre dados existentes desconhecidos.
