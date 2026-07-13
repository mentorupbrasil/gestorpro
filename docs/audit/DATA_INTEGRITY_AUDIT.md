# Auditoria de integridade multi-tenant

## Achado

As migrations usam `tenant_id` e FKs simples por `id`, mas a maior parte dos relacionamentos não possui FK composta `(tenant_id, recurso_id)`. RLS não impede uma conexão privilegiada ou bug interno de relacionar recursos de tenants diferentes.

## Estado por camada

- plataforma: uniques por tenant existem para códigos, mas faltam chaves compostas canônicas `(tenant_id, id)`;
- domínio ocupacional: empresa, vínculo, PCMSO, protocolo e riscos usam FKs simples;
- agenda/atendimento/exames/documentos/financeiro: relações críticas também usam FKs simples;
- exclusões usam predominantemente `ON DELETE RESTRICT`, o que é adequado.

## Correção necessária

Adicionar gradualmente `UNIQUE (tenant_id, id)` nos pais e FKs compostas nos filhos, validar dados existentes e criar testes que tentem inserir referências cruzadas via papel privilegiado. A mudança não deve ser aplicada sem validação SQL completa das migrations atuais, pois pode revelar dados fictícios inconsistentes já existentes.

Estado: `BLOQUEADOR DO GATE DA FASE A`; nenhuma alegação de integridade cruzada completa até a migration composta passar em banco descartável.
