# Bloqueios

## Produção / merge

- **NO-GO** permanente até GO humano.
- Ver `docs/status/HUMAN_ACTIONS.md` (privado, token, Vercel, proteção da `main`).

## CI remoto

- Build Vercel: typecheck corrigido localmente (`z.input` Zod).
- `quality`: lint `Date.now` em integrações corrigido localmente (`pnpm lint` OK).
- Dependency review: **não é falha de código** — “Dependency review is not supported”; habilitar Dependency graph em https://github.com/mentorupbrasil/gestorpro/settings/security_analysis. Aviso Node 20 é do action, não do workflow app (CI já usa Node 24).
- Awaiting commit/push e revalidação remota. Não afirmar “CI verde” sem evidência na PR #11.
- CI workflow ignora push direto na `main` (`branches-ignore: [main]`) — esperado até branch protection humana.

## Auth unit-scoped

- Clínico + exames + check-in + display: gate app corrige unit-only (código nesta unidade).
- Residual: policies RLS de exames/listagens ainda tipicamente `has_tenant_permission` — unit-only pode ver lista vazia até ondas RLS.

## P0.4 / P0.5 / P0.6

- `010`–`023` aplicadas (dono).
- `024` (estrutura ocupacional + PCMSO RPC) no repo — apply pendente.
- Dívida ainda aberta: fluxo PCMSO draft→approve humanizado completo; ASO PDF; preço server-side; portal IDOR; CI/Dependency Review/Vercel — evidência externa.
- Fase N / produção: **NO-GO**.

## Já resolvido (não reabrir)

- P0.1–P0.3 operacionais MFA
- Typegen oficial + fingerprint LF-safe (regenerar após novas migrations se necessário)
- FKs ondas 1–3
- SST write-rpc-only (`023`)
- DML residual de estrutura/PCMSO no app (`024`, após apply)
