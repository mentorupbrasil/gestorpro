# Bloqueios

## Produção / merge

- **NO-GO** permanente até GO humano.
- Ver `docs/status/HUMAN_ACTIONS.md` (privado, token, Vercel, proteção da `main`).

## CI remoto

- Não afirmar “CI verde” sem evidência na PR #11. Checks remotos não foram revalidados nesta sessão (`gh` indisponível no PATH do agente).
- CI workflow ignora push direto na `main` (`branches-ignore: [main]`) — esperado até branch protection humana.

## Auth unit-scoped

- Bug clínico (gate `requirePermission` antes do escopo de unidade) corrigido no código desta unidade.
- Exames/agenda/display ainda usam em grande parte `requirePermission` tenant-wide — risco residual, fora deste corte.

## P0.4 / P0.5 / P0.6

- `010`/`011` aplicadas (dono).
- `012` (onda 4) no repo; apply a confirmar pelo dono.

## Já resolvido (não reabrir)

- P0.1–P0.3 operacionais MFA
- Typegen oficial + fingerprint LF-safe (regenerar após novas migrations se necessário)
- FKs ondas 1–3
