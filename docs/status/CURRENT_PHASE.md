# Fase atual

- Branch: `feat/p0-security-rpc-checkin`
- PR: https://github.com/mentorupbrasil/gestorpro/pull/12
- Caminho clínico guiado: conclusão assina + ASO + snapshot/fatura + close (UI)
- Transições de etapa após triagem/consulta/conclusão
- Painel: Realtime broadcast + poll fallback + heartbeat API + voz pt-BR
- Exames: filas select (lab/diagnóstico/audiometria)
- Portal IDOR: pgTAP ampliado (overview cross-company)
- Bootstrap: admin pode autoatribuir papéis operacionais (`035`, MFA) — desbloqueia tenant com um único usuário
- Produção: **NO-GO** até HUMAN_ACTIONS.md
- Atualizado em: 2026-07-16

## Ainda aberto (humano)

- Apply `035` no Postgres do preview/test (e depois prod com GO)
- Merge `main` / deploy produção / apply migrations prod
- GO / pentest / piloto
- Na UI: MFA → Acessos → conceder Recepcionista (e opcionalmente outros) → Unidades → criar unidade
