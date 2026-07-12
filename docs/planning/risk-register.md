# Registro de riscos

| ID   | Risco                                     | Prob./impacto | Mitigação                                        | Estado            |
| ---- | ----------------------------------------- | ------------- | ------------------------------------------------ | ----------------- |
| R-01 | repositório público para produto de saúde | média/crítico | tornar privado antes de código sensível; scanner | validação humana  |
| R-02 | lock-in Supabase/Vercel                   | média/médio   | portas de domínio, SQL portátil, export/restore  | aberto            |
| R-03 | custo/região/latência                     | média/médio   | confirmar planos/regiões e teste de latência     | aberto            |
| R-04 | falha de isolamento                       | baixa/crítico | autorização + RLS + testes A/B                   | aberto            |
| R-05 | regra clínica inventada                   | média/crítico | configuração versionada e aceite profissional    | bloqueio produção |
| R-06 | perda de documentos no Storage            | média/crítico | versionamento, inventário, backup e restore      | aberto            |
| R-07 | concorrência em check-in/chamada          | média/alto    | transação, unique, lock, idempotência            | aberto            |
| R-08 | escopo excessivo                          | alta/alto     | fases, feature flags e MVP                       | aberto            |
| R-09 | integração/eSocial instável               | alta/alto     | adaptadores, layouts oficiais versionados        | validação futura  |
| R-10 | indisponibilidade de internet             | média/alto    | contingência operacional e reconciliação         | aberto            |
