# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).
- Push direto na `main` continua proibido (branch protection humana).

## Aberto

- E2E autenticado completo do percurso ocupacional (empresa → ASO → faturamento)
- Painel público de chamadas com auth de dispositivo / heartbeat / voz
- P2 exames (lab/ECG etc. estações completas) e P3 ASO assinado + portal IDOR ampliado
- CI remoto desta branch ainda sem evidência até abrir/atualizar PR

## Fechado nesta linha (DB + código)

- Allowlist RPC (`028`)
- Check-in transacional (`029`)
- Papéis sem clínico automático no `tenant_admin` (`030`)
- Agenda AAL2/unidade/referral (`031`)
- Transição de etapa + call_event + display RPC (`032`)
