# Auditoria da Fase 1 — em andamento

| Requisito                      | Estado                   | Evidência/pendência                                                           |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------- |
| Next.js + TypeScript strict    | ATENDIDO                 | typecheck e build verdes                                                      |
| lint, formatação, testes e CI  | ATENDIDO                 | gates locais e CI remoto verdes                                               |
| lockfile e supply chain        | ATENDIDO                 | lock atualizado; política do pnpm passou                                      |
| ambientes seguros              | ATENDIDO DOCUMENTALMENTE | `.env.example`, `docs/operations/environments.md`                             |
| Supabase SSR/Auth              | PARCIAL                  | clients lazy, proxy, login/seleção; E2E autenticado depende de ambiente       |
| tenants/unidades/memberships   | VALIDADO EM BANCO REAL   | migration aplicada e script Supabase real passou                              |
| roles/permissions              | VALIDADO EM BANCO REAL   | RBAC e permissões usados nos cenários RLS                                     |
| tenant não confiado ao cliente | VALIDADO EM BANCO REAL   | contexto de tenant B negado para usuário A com `42501`                        |
| autorização server-side        | VALIDADO EM BANCO REAL   | RPC autorizada cria unidade; auto-bloqueio negado                             |
| RLS                            | VALIDADO EM BANCO REAL   | tenant A/B, membership bloqueada e políticas exercitadas via Session Pooler   |
| auditoria append-only          | VALIDADO EM BANCO REAL   | trigger bloqueia update com `42501`                                           |
| request ID/erros               | ATENDIDO                 | contrato público redigido e unitários verdes                                  |
| observabilidade básica         | ATENDIDO                 | logger limitado e teste verde                                                 |
| usuário bloqueado perde acesso | VALIDADO EM BANCO REAL   | membership bloqueada vê 0 tenants                                             |
| MFA crítico                    | PARCIAL                  | gate AAL2 existe; enrollment/política dependem do ambiente                    |
| isolamento tenant A/B          | VALIDADO EM BANCO REAL   | script validou tenant A sem acesso ao tenant B                                |
| E2E login/isolamento           | PARCIAL                  | landing/login e sem sessão verdes; login real/tenant A-B dependem de Supabase |
| nenhum domínio clínico         | ATENDIDO                 | inventário atual contém apenas plataforma                                     |
| nenhum segredo                 | ATENDIDO ATÉ AQUI        | somente placeholders; scanner estático sem achados                            |

## Decisão atual

Fase 1 permanece `IN_PROGRESS`. O checkpoint de banco/RLS real está verde, mas a fase não será aceita nem liberará a Fase 2 enquanto MFA/AAL2 real, E2E autenticado e typegen Supabase não tiverem evidência suficiente.
