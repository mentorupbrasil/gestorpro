# Auditoria da Fase 1 — em andamento

| Requisito                      | Estado                     | Evidência/pendência                                                 |
| ------------------------------ | -------------------------- | ------------------------------------------------------------------- |
| Next.js + TypeScript strict    | IMPLEMENTADO, NÃO VALIDADO | config e App Router; typecheck/build pendentes                      |
| lint, formatação, testes e CI  | PARCIAL                    | ferramentas/CI configurados; nova suíte local pendente              |
| lockfile e supply chain        | PARCIAL                    | lock gerado e política passou; `server-only` ainda fora do lock     |
| ambientes seguros              | ATENDIDO DOCUMENTALMENTE   | `.env.example`, `docs/operations/environments.md`                   |
| Supabase SSR/Auth              | IMPLEMENTADO, NÃO VALIDADO | clients lazy, proxy, login e seleção tenant                         |
| tenants/unidades/memberships   | IMPLEMENTADO, NÃO VALIDADO | Drizzle + migration + RPCs                                          |
| roles/permissions              | IMPLEMENTADO, NÃO VALIDADO | RBAC, tenant admin e gates de aplicação/banco                       |
| tenant não confiado ao cliente | IMPLEMENTADO, NÃO VALIDADO | cookie é revalidado por membership/RPC                              |
| autorização server-side        | IMPLEMENTADO, NÃO VALIDADO | `requirePermission` + RPC transacional                              |
| RLS                            | BLOQUEADO PARA VALIDAÇÃO   | policies e pgTAP existem; Docker/Supabase ausentes                  |
| auditoria append-only          | IMPLEMENTADO, NÃO VALIDADO | trigger, RPC interna e teste negativo                               |
| request ID/erros               | IMPLEMENTADO, NÃO VALIDADO | contrato público redigido e unitários                               |
| observabilidade básica         | IMPLEMENTADO, NÃO VALIDADO | logger operacional de campos limitados                              |
| usuário bloqueado perde acesso | IMPLEMENTADO, NÃO VALIDADO | funções checam profile/membership ativa; pgTAP preparado            |
| MFA crítico                    | PARCIAL                    | gate AAL2 existe; enrollment/política dependem do ambiente          |
| isolamento tenant A/B          | BLOQUEADO PARA VALIDAÇÃO   | teste pgTAP preparado; execução real pendente                       |
| E2E login/isolamento           | PARCIAL                    | fluxo público/sem sessão criado; browsers e ambiente auth pendentes |
| nenhum domínio clínico         | ATENDIDO                   | inventário atual contém apenas plataforma                           |
| nenhum segredo                 | ATENDIDO ATÉ AQUI          | somente placeholders; scanner estático sem achados                  |

## Decisão atual

Fase 1 permanece `IN_PROGRESS`. Não fazer commit de fase nem avançar enquanto lock, lint, typecheck, unitários, build, migration/RLS e E2E obrigatório não tiverem evidência verde.
