# Próximas ações

1. Rotacionar o `SUPABASE_ACCESS_TOKEN` no dashboard (token antigo vazou no chat) e atualizar só o `.env` local.
2. Revisar Vercel (Production/Preview, env vars) e confirmar que não há dados reais no deploy publicado.
3. Empurrar a branch com P0.4 + format fix para CI remoto verde (sem merge em `main` de produção).
4. Próximas ondas de FK composta: empresa/contrato, agenda/referral, exames, financeiro.
5. Não iniciar a Fase B enquanto revisão Vercel/segredos e waves restantes de integridade permanecerem abertas; **sem** GO de produção.
