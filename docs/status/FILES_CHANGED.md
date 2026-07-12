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
