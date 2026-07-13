# Rastreabilidade de requisitos

| Requisito mestre | Implementação/evidência atual | Teste/gate | Estado |
| --- | --- | --- | --- |
| tenant não confiado ao cliente | contexto por sessão/RPC | tenant A/B | parcial |
| escopo por unidade | `unitPermissions`, `has_unit_permission` | unidade A/B | implementado, DB pendente |
| DML crítico por RPC auditada | revogação global e freeze fail-closed | bypass AAL1/DML | implementado, DB pendente |
| último administrador protegido | `set_membership_status` transacional | último admin | implementado, DB pendente |
| integridade multi-tenant composta | auditoria de lacunas | FK cruzada | não atendido |
| typegen oficial | CLI e drift checker | CI type check | bloqueado por ambiente |
| auditoria de leitura sensível | modelo/documentação | prontuário/download/print | parcial |
| ASO não automatizado | regras de domínio | recepção/pendência | parcial |
| documento imutável/privado | migration/document workflow | sobrescrita/URL | parcial |
| gates completos Fase A | scripts/CI/status | format→E2E→build | em andamento |
