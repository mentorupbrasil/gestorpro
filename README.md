# GestorPro — Plataforma Unimetra

Plataforma de gestão e atendimento em saúde ocupacional em monólito modular multi-tenant. O repositório possui uma aplicação Next.js, migrations e checkpoints funcionais parciais, mas está na **Fase A — reauditoria e correção da fundação** e permanece **NO-GO para produção**.

## Fontes de verdade

- [Especificação-mestre](docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md)
- [Guia de execução](docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md)
- [Plano Mestre V2](docs/product/UNIMETRA_PLANO_MESTRE_V2_CODEX.md)
- [Estado geral](docs/status/MASTER_STATUS.md)
- [Fase atual](docs/status/CURRENT_PHASE.md)
- [Próximas ações](docs/status/NEXT_ACTIONS.md)

## Princípios inegociáveis

- decisões clínicas finais são humanas;
- dados e documentos clínicos são privados, versionados e auditáveis;
- o tenant é resolvido no backend e reforçado por RLS;
- banco é a fonte durável; Realtime apenas transporta eventos;
- operações críticas usam transação, idempotência e outbox;
- nenhum dado real ou segredo é admitido no repositório.

## Estrutura documental

`docs/architecture`, `docs/database`, `docs/permissions`, `docs/security`, `docs/workflows`, `docs/testing`, `docs/operations`, `docs/planning`, `docs/decisions` e `docs/status` registram a fundação e a continuidade do projeto.

## Execução local

Use `pnpm dev` para desenvolvimento e `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` como gates locais. O typegen oficial usa `pnpm types:supabase:generate` com `SUPABASE_PROJECT_ID` e `SUPABASE_ACCESS_TOKEN` temporários; o token nunca deve ser salvo.

Mutações antigas ainda não reauditedas estão congeladas por segurança. Produção, dados reais, merge na `main` e integrações externas reais não estão autorizados.
