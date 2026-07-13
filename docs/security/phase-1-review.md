# Revisão de segurança — Fase 1 (superada pela Fase A)

O estado canônico está em `docs/audit/AUTHORIZATION_AUDIT.md`, `RLS_AUDIT.md` e `DATA_INTEGRITY_AUDIT.md`. Os achados antigos abaixo são preservados como histórico e não representam aceite atual.

## Achados corrigidos

| Severidade | Achado                                                                        | Correção                                                                                           |
| ---------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| ALTA       | assignment de unidade poderia apontar para unidade de outro tenant            | policy valida que `clinic_unit_id` pertence ao mesmo tenant da membership                          |
| ALTA       | RPC genérica de auditoria aceitava metadata arbitrária de usuário autenticado | execução pública/autenticada removida; somente RPCs internas específicas gravam auditoria          |
| ALTA       | proxy poderia ser confundido com autorização suficiente                       | páginas/casos de uso revalidam usuário, membership e permissão; documentação explícita             |
| MÉDIA      | armazenamento externo do pnpm quebrava resolução de peers                     | dependências internas restauradas; gates locais verdes                                             |
| MÉDIA      | Turbopack inferia raiz externa                                                | `turbopack.root` fixado no diretório do projeto                                                    |
| MÉDIA      | visitante sem cookie aguardava Supabase indisponível                          | protected layout e proxy redirecionam localmente; cookies existentes continuam validados pelo Auth |

## Achados abertos

| Severidade           | Achado                                                     | Tratamento exigido                                                                                       |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| BLOQUEADOR DE ACEITE | RLS/migration ainda não executadas em Supabase descartável | instalar runtime local ou fornecer ambiente de teste autorizado; executar tenant A/B e audit append-only |
| ALTA                 | tipos Supabase ainda são genéricos                         | gerar tipos depois da migration validada e remover inferência permissiva                                 |
| MÉDIA                | rate limits do Auth não foram confirmados no projeto real  | validar configurações oficiais do Supabase e acrescentar proteção complementar se necessária             |
| MÉDIA                | CSP não foi definida                                       | projetar nonce compatível com Next.js e validar UI antes de habilitar; demais headers já aplicados       |
| MÉDIA                | E2E autenticado exige projeto local/preview                | executar login, tenant válido, tenant negado, membership bloqueada e AAL2                                |

## Verificação do checkpoint

Formatação, lint, TypeScript, 18 unitários, 2 E2E sem sessão e build passaram. A revisão não promove a Fase 1 enquanto o PostgreSQL/RLS real permanecer sem evidência.
