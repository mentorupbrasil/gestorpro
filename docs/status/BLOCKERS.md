# Bloqueios

## Produção / merge

- **NO-GO** permanente até GO humano.
- Ver `docs/status/HUMAN_ACTIONS.md` (privado, token, Vercel, proteção da `main`).

## CI remoto

- Não afirmar “CI verde” sem evidência na PR #11. Checks remotos não foram revalidados nesta sessão (`gh` indisponível no PATH do agente).
- CI workflow ignora push direto na `main` (`branches-ignore: [main]`) — esperado até branch protection humana.

## Auth unit-scoped

- Clínico + exames + check-in + display: gate app corrige unit-only (código nesta unidade).
- Residual: policies RLS de exames/listagens ainda tipicamente `has_tenant_permission` — unit-only pode ver lista vazia até ondas RLS.

## P0.4 / P0.5 / P0.6

- `010`–`020` aplicadas (dono).
- `021` (Fase L integrações) no repo — apply pendente.

## Já resolvido (não reabrir)

- P0.1–P0.3 operacionais MFA
- Typegen oficial + fingerprint LF-safe (regenerar após novas migrations se necessário)
- FKs ondas 1–3
