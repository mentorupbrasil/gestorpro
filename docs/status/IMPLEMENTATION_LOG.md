# Log de implementação

## 2026-07-12

- Confirmados raiz, remoto, branch, status, arquivos e histórico.
- Atualizada referência remota e aplicada atualização fast-forward sem sobrescrita.
- Criada branch de trabalho contínua.
- Lidos os documentos obrigatórios e movidos para nomes canônicos em `docs/product/`.
- Registrado conflito de continuidade no ADR-0006.
- Criada fundação documental da Fase 0; nenhum código funcional, dependência, banco ou serviço foi criado.
- Commit técnico da Fase 0: `5fdba2e`.
- Fase 1 iniciada com Next.js 16.2.10, React 19.2.7 e TypeScript 5.9.3.
- Criados bootstrap, CI, configuração estrita, clientes lazy, erros públicos, request ID, autorização tenant-aware, autenticação SSR e seleção explícita de tenant.
- Criados schema Drizzle, migration inicial, políticas RLS, contexto de autorização no banco e auditoria append-only.
- Criados fluxos reais de login, seleção de tenant, listagem/criação de unidades e bloqueio/reativação de memberships com confirmação e auditoria.
- Revisão React adicionou navegação funcional, loading, error state, mensagens acessíveis e tabelas operacionais.
- Revisão de segurança corrigiu escopo de unidade cruzado e removeu acesso autenticado à função genérica de auditoria.
- Nenhuma migration foi aplicada e nenhum serviço externo foi conectado.
- Commit `aef748a` foi publicado pelo usuário e abriu a PR #1; CI falhou em formatação do `tsconfig.json`.
- Corrigidos o CI e o redirecionamento sem sessão, que antes aguardava Supabase indisponível.
- Gates locais finais do checkpoint: formatação, lint, typecheck, 18 unitários, 2 E2E e build verdes.
- Adicionados callback seguro de autenticação, allowlist de redirecionamento, política de senha forte, recuperação de senha, troca de senha e logout local.
- Corrigido o runner E2E local no Windows para subir `next start`, executar Playwright e encerrar o servidor sem travar.
- Gates locais do checkpoint de autenticação: formatação, lint, typecheck, 22 unitários, 4 E2E e build verdes.
- Criado validador de Supabase real com Session Pooler, sem persistir segredos.
- Aplicada migration da Fase 1 em Supabase de teste autorizado e validados RLS, isolamento tenant A/B, bloqueio de membership e auditoria append-only.
- Corrigida ambiguidade SQL em `get_my_authorization_context` identificada pelo E2E autenticado.
- Adicionada tela de Segurança da conta com enrollment TOTP, desafio MFA e remoção de fator.
- Ações críticas de unidades e memberships passaram a exigir `aal2` além de permissão RBAC.
- Criado seed autenticado reproduzível para Supabase real, preservando auditoria append-only e limpando fatores MFA do usuário fictício.
- E2E autenticado real passou com login, seleção de tenant, bloqueio sem MFA, cadastro TOTP, sessão `aal2` e criação de unidade auditada.
