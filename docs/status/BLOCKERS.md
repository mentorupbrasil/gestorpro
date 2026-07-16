# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).
- Push direto na `main` continua proibido (branch protection humana).

## Aberto (humano)

- Merge PR #12 → `main`
- Apply migrations no Postgres de produção
- Deploy produção + pentest/piloto

## Operacional (tenant real / preview)

- Conta só com `tenant_admin` / tenant vazio: check-in e triagem não operam até bootstrap (`036`) ou setup manual.
- Após `035`/`036` + deploy: botão **Inicializar operação** (MFA) cria unidade, formulário de triagem, ASO stub e papéis.

## Fechado nesta linha (engenharia)

- Allowlist RPC / check-in / papéis / agenda timezone
- Transição + call_event + display
- Embeds PGRST201 + E2E ocupacional navegação
- Fechamento guiado na conclusão (ASO + billing + close)
- Painel Realtime + heartbeat
- Exames por fila
- Portal IDOR overview ampliado
- Bootstrap self-grant operacional (`035`)
- Bootstrap tenant ops (`036`: unidade + triagem + ASO + papéis)
