# ADR-0008 — Mutações críticas somente por RPC endurecida

**Status:** ACEITA TECNICAMENTE NA FASE A

## Contexto

Policies históricas permitiam DML direto e `has_tenant_permission` promovia papéis limitados à unidade. Isso permitia contornar serviço, AAL2 e auditoria.

## Decisão

- revogar DML direto de `anon` e `authenticated`;
- remover policies de escrita;
- separar permissão tenant-wide e por unidade/recurso;
- congelar RPCs mutacionais até reauditoria individual;
- exigir AAL2 no banco para operações críticas;
- manter auditoria na mesma transação;
- reabrir mutações por fase somente com testes negativos.

## Consequências

O sistema falha fechado e checkpoints antigos podem perder mutações até serem endurecidos. Essa indisponibilidade controlada é preferível a manter bypass crítico. Leituras continuam sujeitas a RLS e autorização.
