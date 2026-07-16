# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).
- Push direto na `main` continua proibido (branch protection humana).

## Aberto

- E2E clínico profundo (ASO assinado → faturamento), além da navegação já verde
- Painel público de chamadas com Realtime / voz
- P2 exames (lab/ECG etc. estações completas) e portal IDOR ampliado

## Fechado nesta linha (DB + código)

- Allowlist RPC (`028`)
- Check-in transacional (`029`)
- Papéis sem clínico automático no `tenant_admin` (`030`)
- Agenda AAL2/unidade/referral (`031`)
- Transição de etapa + call_event + display RPC (`032`)
- Embeds PGRST201 + E2E ocupacional autenticado (navegação + check-in)
