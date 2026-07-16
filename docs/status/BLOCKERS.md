# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).
- Push direto na `main` continua proibido.

## CI / engenharia (aberto nesta reauditoria)

- Remoto: `quality` falhou em `format:check` (corrigido local; precisa push).
- Local: `lint` (refs no painel público) e `types:supabase:check` (fingerprint 035/036).
- ASO operacional ainda usa stub PDF.
- Faturamento guiado ainda injeta `E2E_EXAM`.
- `transition_encounter_step` ainda aceita fallback `encounters.manage` para etapas clínicas.
- Bootstrap `036` ainda self-grant papéis clínicos/financeiros e aprova templates.

## Aberto (humano)

- Merge PR #12 → `main`
- Apply migrations no Postgres de produção
- Deploy produção + pentest/piloto

## Fechado nesta linha (engenharia histórica)

- Allowlist RPC / check-in / papéis / agenda timezone (código na branch)
- Embeds PGRST201 + E2E ocupacional navegação
- Painel Realtime + heartbeat (com débito de lint atual)
