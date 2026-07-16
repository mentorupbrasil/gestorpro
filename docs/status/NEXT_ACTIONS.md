# Próximas ações

1. Aplicar migration `041` no Postgres de teste autorizado (`pnpm migrate:upgrade` ou apply one)
2. Configurar secrets do job `authenticated-e2e` no GitHub (URL real, usuário E2E, MFA, service role, PG*)
3. Rodar `pnpm migrate:fresh` + `pnpm test:pgtap` em ambiente descartável e anexar evidência em `TEST_RESULTS.md`
4. Você: revisar PR #12; **não** merge/prod sem GO
5. Humano: ensaio de restore (backup) e registrar evidência
6. Continuar fases 7–20 (template ASO verificável, billing executado, PCMSO autoritativo, portais, SST/eSocial)
