# Auditoria da Fase 1 — em andamento

| Requisito                      | Estado                     | Evidência/pendência                                                           |
| ------------------------------ | -------------------------- | ----------------------------------------------------------------------------- |
| Next.js + TypeScript strict    | ATENDIDO                   | typecheck e build verdes                                                      |
| lint, formatação, testes e CI  | PARCIAL                    | gates locais verdes; novo CI remoto aguardando publicação                     |
| lockfile e supply chain        | ATENDIDO                   | lock atualizado; política do pnpm passou                                      |
| ambientes seguros              | ATENDIDO DOCUMENTALMENTE   | `.env.example`, `docs/operations/environments.md`                             |
| Supabase SSR/Auth              | PARCIAL                    | clients lazy, proxy, login/seleção; E2E autenticado depende de ambiente       |
| tenants/unidades/memberships   | IMPLEMENTADO, NÃO VALIDADO | Drizzle + migration + RPCs                                                    |
| roles/permissions              | IMPLEMENTADO, NÃO VALIDADO | RBAC, tenant admin e gates de aplicação/banco                                 |
| tenant não confiado ao cliente | IMPLEMENTADO, NÃO VALIDADO | cookie é revalidado por membership/RPC                                        |
| autorização server-side        | IMPLEMENTADO, NÃO VALIDADO | `requirePermission` + RPC transacional                                        |
| RLS                            | BLOQUEADO PARA VALIDAÇÃO   | policies e pgTAP existem; Docker/Supabase ausentes                            |
| auditoria append-only          | IMPLEMENTADO, NÃO VALIDADO | trigger, RPC interna e teste negativo                                         |
| request ID/erros               | ATENDIDO                   | contrato público redigido e unitários verdes                                  |
| observabilidade básica         | ATENDIDO                   | logger limitado e teste verde                                                 |
| usuário bloqueado perde acesso | IMPLEMENTADO, NÃO VALIDADO | funções checam profile/membership ativa; pgTAP preparado                      |
| MFA crítico                    | PARCIAL                    | gate AAL2 existe; enrollment/política dependem do ambiente                    |
| isolamento tenant A/B          | BLOQUEADO PARA VALIDAÇÃO   | teste pgTAP preparado; execução real pendente                                 |
| E2E login/isolamento           | PARCIAL                    | landing/login e sem sessão verdes; login real/tenant A-B dependem de Supabase |
| nenhum domínio clínico         | ATENDIDO                   | inventário atual contém apenas plataforma                                     |
| nenhum segredo                 | ATENDIDO ATÉ AQUI          | somente placeholders; scanner estático sem achados                            |

## Decisão atual

Fase 1 permanece `IN_PROGRESS`. O checkpoint da aplicação está verde e pode ser publicado, mas a fase não será aceita nem liberará a Fase 2 enquanto migration, RLS e isolamento tenant A/B não tiverem evidência em banco descartável.
