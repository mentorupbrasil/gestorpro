# Gates das fases

## Gate A

- documentação sincronizada;
- typegen oficial e cliente tipado;
- format, lint, TypeScript, unitários, integração, RLS, E2E e build verdes;
- CI verde e PR draft;
- nenhum bypass de AAL2/auditoria;
- escopo por unidade comprovado;
- tenant cruzado impedido por autorização, RLS e integridade composta;
- último administrador protegido;
- segredo ausente; nenhum merge/produção.

## Gate global

Regra, autorização server-side, RLS, integridade, Zod, transação, idempotência, auditoria, erro tipado, observabilidade, estados de UI, acessibilidade, testes negativos, migration, rollback e documentação.

Critério atual: Gate A `NÃO ATENDIDO` por typegen, PostgreSQL real, integridade composta, CI/PR e E2E autenticado.
