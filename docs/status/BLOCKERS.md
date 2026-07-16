# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).
- Push direto na `main` continua proibido (branch protection humana).

## Aberto (humano)

- Merge PR #12 → `main`
- Apply migrations no Postgres de produção
- Deploy produção + pentest/piloto

## Fechado nesta linha (engenharia)

- Allowlist RPC / check-in / papéis / agenda timezone
- Transição + call_event + display
- Embeds PGRST201 + E2E ocupacional navegação
- Fechamento guiado na conclusão (ASO + billing + close)
- Painel Realtime + heartbeat
- Exames por fila
- Portal IDOR overview ampliado
