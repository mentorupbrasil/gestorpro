# Arquivos alterados

## Fase 0

- Movidos: os dois documentos-fonte da raiz para `docs/product/` com nomes canônicos.
- Criados: README, AGENTS, arquitetura, banco conceitual, permissões, segurança, workflows, testes, operações, planejamento, ADRs e controles de status.
- Código/migrations/dependências: nenhum.

O inventário exato deve ser obtido com `git status --short` e registrado novamente no fechamento.

## Fase 1 — em andamento

- Bootstrap Next.js, TypeScript, Tailwind, ESLint, Prettier, Vitest, Playwright e CI.
- Núcleo de erros, autorização, tenancy, ambientes, Supabase SSR e banco lazy.
- Schema Drizzle, migration SQL, RLS, auditoria e testes unitários/SQL iniciais.
- Telas e ações reais de login, seleção de tenant, unidades e memberships; loading/error/empty/permission states.
- Revisão de segurança da Fase 1 e ADR de fronteiras Auth/banco.
- Alterações ainda não commitadas porque os gates permanecem pendentes.

## Fase 1 — checkpoint de autenticação segura

- Configuração: `.github/workflows/ci.yml`, `.env.example`, `next.config.ts`, `package.json`, `playwright.config.ts`, `vercel.json`.
- Runner: `scripts/run-e2e.mjs`.
- Autenticação: callback seguro, recuperação de senha, troca de senha, logout local, política de senha forte e allowlist de redirecionamento.
- Testes: novos unitários de senha/redirecionamento e E2E cobrindo recuperação de senha e callback sem código.
- Status: documentos atualizados com gates verdes da aplicação e bloqueio persistente de Supabase/RLS real.
