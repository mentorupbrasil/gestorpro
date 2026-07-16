# Bloqueios

## Produção / merge

- **NO-GO** até GO humano (`HUMAN_ACTIONS.md`).

## Humano

- Merge PR #12 → `main` (somente após GO)
- Apply `037`–`041` em preview/prod após GO (teste local histórico: `037`–`040`; `041` nova nesta rodada)
- Configurar secrets CI para `authenticated-e2e` (sem skip silencioso)
- Pentest / validação médica-jurídica / piloto
- Restore de backup ensaiado com evidência em `TEST_RESULTS.md`

## Engenharia ainda aberta (fora do mínimo desta rodada)

- E2E autenticado completo 40 passos com personas por papel (job existe; exige secrets reais)
- Portal trabalhador dedicado
- SST expandido (CAT/PPP/LTCAT) e eSocial com transporte real
- Workflow durável `closure_workflows` além de `encounter_closures`
- Motor PCMSO autoritativo único versionado + revalidação no check-in
- Permissões por modalidade de exame
- Observabilidade APM/Sentry
- Acessibilidade dedicada / carga / pentest
- Evidência local de migrations fresh/upgrade (depende de Postgres descartável; job CI criado)

## Fechado nesta rodada (código)

- Bypass de `transition_encounter_step` → `completed` removido (`041`)
- `encounter_closures` + close idempotente sem early-return cego
- `finalize_document_version_render` somente `service_role` + verificação de storage
- `get_encounter_close_readiness` + UI sem hardcodes de invoice/ASO/steps
- Separação geração / assinatura / entrega de ASO na UI
- CI: `ui-smoke` vs `authenticated-e2e` (falha sem secrets) + migrations fresh/upgrade + pgTAP runner
