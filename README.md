# GestorPro — Plataforma Unimetra

Plataforma greenfield de gestão e atendimento em saúde ocupacional, concebida como monólito modular multi-tenant. O repositório está na Fase 0: fundação documental, sem aplicação executável ou conexão com serviços externos.

## Fontes de verdade

- [Especificação-mestre](docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md)
- [Guia de execução](docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md)
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

## Execução

Não há comandos de aplicação nesta fase. O plano técnico executável começa em [phase-1-plan.md](docs/planning/phase-1-plan.md). Produção, dados reais e integrações externas dependem de validações humanas explícitas.
