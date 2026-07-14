# Bloqueios

## Produção / merge

- **NO-GO** permanente até GO humano.
- Ver `docs/status/HUMAN_ACTIONS.md` (privado, token, Vercel, proteção da `main`).

## CI remoto

- PR #11 (commit `40db238`): **quality, review, Vercel, CodeQL** passaram.
- Causa do `types:supabase:check`: fingerprint das migrations atualizado com typegen offline + Prettier no arquivo gerado.
- Scripts de typegen agora rodam Prettier após gerar (`f74e295`) para não reeditar `format:check`.
- CI workflow ignora push direto na `main` (`branches-ignore: [main]`) — esperado até branch protection humana.

## Auth unit-scoped

- Clínico + exames + check-in + display: gate app corrige unit-only (código nesta unidade).
- Residual: policies RLS de exames/listagens ainda tipicamente `has_tenant_permission` — unit-only pode ver lista vazia até ondas RLS.

## P0.4 / P0.5 / P0.6

- `010`–`024` aplicadas. `025` portal IDOR + `026` preço server-side no repo — **apply pendente**.
- Dívida restante: ASO PDF/storage; PCMSO draft→approve humanizado; polimento.
- Fase N / produção: **NO-GO**.

## Já resolvido (não reabrir)

- P0.1–P0.3 operacionais MFA
- Typegen oficial + fingerprint LF-safe (regenerar após novas migrations se necessário)
- FKs ondas 1–3
- SST write-rpc-only (`023`)
- DML residual de estrutura/PCMSO no app (`024`, após apply)
