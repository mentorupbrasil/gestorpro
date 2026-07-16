# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).

## Humano

- Merge PR #12 → `main`
- Apply `037`–`040` em preview/prod após GO (teste local já aplicou)
- Pentest / validação médica-jurídica / piloto
- Restore de backup ensaiado com evidência em `TEST_RESULTS.md`

## Engenharia ainda aberta

- E2E autenticado completo (40 passos + asserções DB) — specs profundos existem, close/ASO ponta a ponta ainda não fechado em CI
- Portal trabalhador dedicado (ausente; portal empresa é scaffold)
- SST expandido (CAT/PPP/LTCAT etc.) e eSocial com transporte real (bloqueado fora de sandbox)
- Encerramento com workflow storage externo além da RPC `033`
- Observabilidade APM/Sentry (só logger + health deep)
- Acessibilidade dedicada / carga / pentest
