# Fase atual

- Branch: `feat/p0-security-rpc-checkin`
- PR: https://github.com/mentorupbrasil/gestorpro/pull/12
- Foco imediato: **P0 — CI verde + autorização estrita + ASO real + billing real + bootstrap admin-only**
- Reauditoria 2026-07-16: docs anteriores superestimavam prontidão; stubs/E2E_EXAM/fallback de permissão confirmados no código
- Produção: **NO-GO** até HUMAN_ACTIONS.md
- Atualizado em: 2026-07-16

## Ainda aberto (humano)

- Apply migrations novas (`037+`) no Postgres de preview/test (e depois prod com GO)
- Merge `main` / deploy produção / apply migrations prod — **não automatizar**
- GO / pentest / piloto / validação médica-jurídica
