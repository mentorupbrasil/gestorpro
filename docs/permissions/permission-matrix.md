# Matriz de permissões inicial

Legenda: **A** executar; **R** ler; **S** somente resumo operacional; **—** negado por padrão. Escopos de tenant/unidade/empresa e vínculo profissional continuam obrigatórios.

| Capacidade | Admin tenant | Gestor unidade | Recepção | Enfermagem | Técnico exame | Médico ocupacional | Financeiro | Empresa | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Configurar tenant/unidade | A | R | — | — | — | — | — | — | R |
| Gerenciar memberships/papéis | A | S | — | — | — | — | — | — | R |
| Empresas e estrutura ocupacional | A | A | R | R | S | R | R | R escopado | R |
| Trabalhadores/vínculos | A | A | A | R | S | R | S | R escopado | R |
| PCMSO/protocolos | A técnica | R | S | R | R necessário | A clínica* | — | S | R |
| Check-in/agenda | R | A | A | R | S | R | S | R escopado | R |
| Triagem | — | S | — | A | R necessário | R/A | — | — | R autorizado |
| Resultado de exame específico | — | S | — | R | A por habilitação | R/A | — | — | R autorizado |
| Conclusão médica/aptidão | — | S | — | — | — | A* | — | — | R autorizado |
| Documento sensível/download | S | S | conforme entrega | conforme cuidado | conforme cuidado | A | — | somente liberado | R autorizado |
| Faturamento | R | R | S | — | — | — | A | R contratual | R |
| Auditoria | R administrativa | R unidade | — | — | — | R próprio | R financeira | — | R autorizado |

`*` exige vínculo profissional, registro válido, permissão granular e AAL/MFA conforme ação. Administrador não recebe acesso clínico irrestrito. Empresa nunca acessa prontuário completo. A implementação deve mapear cada célula a códigos como `encounters.check_in`, `triage.write`, `aso.conclude` e `documents.download`.
