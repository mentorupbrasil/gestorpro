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
- Alterações históricas commitadas e consolidadas em `main`; gates externos pendentes continuam registrados separadamente.

## Fase 1 — checkpoint de autenticação segura

- Configuração: `.github/workflows/ci.yml`, `.env.example`, `next.config.ts`, `package.json`, `playwright.config.ts`, `vercel.json`.
- Runner: `scripts/run-e2e.mjs`.
- Autenticação: callback seguro, recuperação de senha, troca de senha, logout local, política de senha forte e allowlist de redirecionamento.
- Testes: novos unitários de senha/redirecionamento e E2E cobrindo recuperação de senha e callback sem código.
- Status: documentos atualizados com gates verdes da aplicação e bloqueio persistente de Supabase/RLS real.

## Fase 1 — validação Supabase real

- Runner: `scripts/validate-phase1-supabase.mjs`.
- Status: documentos atualizados com evidência de migration aplicada, RLS real, tenant A/B, membership bloqueada e auditoria append-only.
- Segredos: nenhuma credencial persistida; senha usada apenas em variável de ambiente temporária durante a execução.

## Fase A — reauditoria V2

- Segurança: nova migration de hardening, contexto tenant/unidade e testes negativos.
- Typegen/supply chain: Supabase CLI, scripts de geração/check, workflows CodeQL/dependency review, Dependabot, scanner e overrides.
- Documentação: auditorias, matrizes de produto/testes, roadmap/gates/dependências/release, break-glass, leitura sensível, sessão/dispositivo, README, AGENTS, ADR-0008 e status.
- Nenhum segredo, dado real, deploy ou produção. Consolidação Git em `main` autorizada pelo responsável e concluída sem reescrita ou perda de histórico.

## 2026-07-14 — fix typecheck Vercel

- `src/features/documents/service.ts`, `exams/schemas.ts`, `finance/service.ts`, `integrations/service.ts`, `portal/service.ts`, `scheduling/schemas.ts`, `sst/service.ts`: Input types `z.infer` → `z.input`.
- Status: `docs/status/*` atualizados.
