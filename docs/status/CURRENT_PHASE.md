# Fase atual

- Branch: `feat/p0-security-rpc-checkin`
- PR: https://github.com/mentorupbrasil/gestorpro/pull/12
- Caminho clínico guiado: conclusão assina + ASO + snapshot/fatura + close (UI)
- Transições de etapa após triagem/consulta/conclusão
- Painel: Realtime broadcast + poll fallback + heartbeat API + voz pt-BR
- Exames: filas select (lab/diagnóstico/audiometria)
- Portal IDOR: pgTAP ampliado (overview cross-company)
- Bootstrap: admin MFA pode inicializar tenant (`036`: unidade + triagem + ASO + papéis) e autoatribuir operacional (`035`)
- Produção: **NO-GO** até HUMAN_ACTIONS.md
- Atualizado em: 2026-07-16

## Ainda aberto (humano)

- Apply `035`–`036` no Postgres do preview/test (e depois prod com GO)
- Na UI (após deploy): MFA → **Inicializar operação deste tenant** (Visão geral / Clínica / Unidades)
- Merge `main` / deploy produção / apply migrations prod
- GO / pentest / piloto
