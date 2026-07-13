# Resultados de testes e verificações

## 2026-07-13 — Validação manual MFA P0.1–P0.3 + RLS negativos

- MFA/TOTP enrollment no usuário demo (`/app/security`): sessão `aal2`.
- Fluxo encounter `e8000000-0000-4000-8000-000000000001` (Tenant E2E):
  - Triagem: rascunho + IMC 24.2 + conclusão; eventos `triage.started`/`triage.completed`.
  - Consulta: SOAP + conclusão; evento `consultation.completed`.
  - Conclusão: `medical_conclusions.signature_status = prepared`, código `fit`.
- Correções necessárias para fechar o fluxo:
  - `totp-enrollment-form.tsx`: QR `data:image/svg+xml` via `<img>` (next/image quebrava).
  - Select de credenciais médicas: incluir `council_region` + `professional_role`.
  - Migration `202607140005_log_audit_alias.sql` (RPCs chamavam `log_audit` inexistente).
  - Migration `202607140006_fix_triage_queue_tickets_update.sql` (remove `queue_tickets.updated_at` inválido).
- `node scripts/validate-rls-bypass-negatives.mjs`: AAL1 bloqueado; outsider sem permissão; tenant B invisível; audit append-only.
- `node --env-file=.env scripts/validate-phase1-supabase.mjs`: passou.
- `npm run types:supabase:generate`: **oficial** (`SUPABASE_ACCESS_TOKEN` + Management API); `types:supabase:check` OK.
- `npm run typecheck`: passou.

## 2026-07-13 — Typegen oficial remoto

- Token gravado só no `.env` (gitignored). CLI Supabase listou o projeto `dacittcezvtqljanhobb`.
- `src/lib/supabase/database.generated.ts` regenerado (~239 KB); fingerprint alinhado às migrations.
- Script `generate-supabase-types.mjs` ajustado para `corepack pnpm` no Windows.
- GitHub CLI instalado; repo tornado privado após login `mentorupbrasil`.

## 2026-07-13 — P0.4 FKs compostas (lote clínico)

- Preflight: 0 mismatches de tenant nos vínculos clínicos.
- Dry-run + apply: `202607140007_p0_4_composite_tenant_fks_clinical.sql`.
- Negativo: update `encounters.worker_id` cruzado bloqueado (`encounters_worker_tenant_fk`).
- Typegen/fingerprint refeitos após migration; `format:check` e `typecheck` OK localmente.

## 2026-07-13 — P0.3 Estação de conclusão operacional

- `npm run typecheck`: passou.
- `npm run test` (triage + consultation + conclusion payload): 16 testes passaram.
- `npm run build`: passou; 27 rotas geradas.
- Migration `202607140004_grant_operational_rpcs.sql` aplicada no Supabase autorizado.
- `seed-clinical-demo.mjs`: executado com sucesso.

## 2026-07-13 — P0.2 Estação de consulta operacional

- `pnpm typecheck`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm test tests/unit/consultation-payload.test.ts tests/unit/triage-payload.test.ts`: 12 testes passaram.
- `pnpm build`: passou; 27 rotas geradas.
- Migration `202607140003_consultation_operational_hardening.sql` aplicada no Supabase autorizado (2026-07-13).

## 2026-07-13 — P0.1 Estação de triagem operacional (fechamento operacional)

### Gates locais (já aprovados nesta unidade)

- `pnpm typecheck`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm test tests/unit/triage-payload.test.ts`: 8 testes passaram.
- `pnpm build`: passou; 27 rotas geradas.
- `pnpm format:check`: arquivos da triagem formatados; avisos remanescentes apenas em arquivos fora do escopo (`database.generated.ts`, `select-tenant/page.tsx`, script offline).

### Migration `202607140002_triage_operational_hardening.sql`

- **Aplicada** no Supabase `dacittcezvtqljanhobb` em 2026-07-13 (schema completo via `apply-all-migrations.mjs`).
- `validate-triage-supabase.mjs`: falhou no mock AAL2 via pooler; funções RPC presentes.

### Checklist manual (`docs/implementation/P0_1_TRIAGEM_OPERACIONAL.md`)

- Itens 1–12: pendentes na UI (`pnpm dev` + MFA).

### Veredito P0.1

- **Migration:** aplicada.
- **Checklist manual UI:** pendente.
- **P0.1 fechado:** não.

## 2026-07-13 — Consolidação segura de branches

- Merge de `origin/main` com o histórico completo executado sem conflitos em branch temporária de integração.
- `pnpm format:check`, `pnpm lint` e `pnpm typecheck`: passaram.
- `pnpm test`: 28 arquivos e 100 testes passaram.
- `pnpm security:secrets`: passou em 281 arquivos rastreados.
- `pnpm audit --audit-level high`: zero vulnerabilidades conhecidas.
- `pnpm build`: passou; 26 rotas geradas.
- `pnpm test:e2e`: 4 públicos passaram; 1 autenticado permaneceu ignorado por ausência de credenciais temporárias.
- `main` remota atualizada sem força; as três branches auxiliares apresentaram zero commits exclusivos antes da remoção.

## 2026-07-13 — Fase A (primeira unidade)

- `pnpm format`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou em TypeScript estrito.
- `pnpm test`: 28 arquivos e 100 testes passaram.
- `pnpm security:secrets`: passou nos arquivos rastreados.
- `pnpm audit --json`: zero vulnerabilidades após overrides.
- `pnpm build`: passou; 26 rotas geradas.
- `pnpm test:e2e`: 4 públicos passaram; 1 autenticado foi ignorado por ausência de variáveis temporárias.
- `pnpm types:supabase:check`: falhou como esperado/seguro porque o arquivo oficial ainda não foi gerado.
- Não executado: migration Fase A em PostgreSQL, testes RLS/bypass/último admin reais, E2E autenticado e CI remoto.

## 2026-07-13 — Auditoria geral pós-checkpoints

- `git status --short --branch`: branch limpa em `chore/fase-11-producao-piloto`.
- Scanner estático de padrões sensíveis: passou; nenhum arquivo com padrão de segredo encontrado fora de pastas ignoradas.
- Scanner de TODO/mock/fake: passou com observação; achados restritos a placeholders de formulário, stubs documentados e fallback E2E.
- `pnpm format:check`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou.
- `pnpm test`: 27 arquivos e 91 testes passaram.
- `pnpm build`: passou com Next.js 16.2.10; 20 rotas geradas.
- `pnpm test:e2e -- public-and-auth.spec.ts`: 4/4 passaram no Chromium.
- Não executado nesta rodada: E2E autenticado real, validação SQL completa de todas as migrations, E2E ponta a ponta, carga, concorrência, backup/restore, pentest e acessibilidade dedicada.

## 2026-07-12 — Verificação inicial

- Raiz Git: confirmada.
- Origin: `https://github.com/mentorupbrasil/gestorpro.git`, equivalente ao remoto exigido.
- Estado inicial: limpo, branch `main`, sem arquivos não rastreados.
- Sincronização: `git fetch` e fast-forward `6ba9a52..80b07f9` concluídos.
- Branch de trabalho: criada `codex/desenvolvimento-completo-unimetra`.
- Scanner inicial de nomes/conteúdo sensível: nenhum achado.

## Fase 0

- `git diff --check`: passou.
- links Markdown relativos: passou, nenhum quebrado.
- estrutura DBML: passou verificação estática de blocos (45/45).
- scanner de segredos e nomes sensíveis: passou, nenhum achado.
- critérios de aceite: 13/13 atendidos conforme `docs/planning/phase-0-audit.md`.
- Lint, typecheck, unitários, integração, E2E, build e migrations: `N/A`, pois a Fase 0 proíbe código, dependências e migrations executáveis.

## 2026-07-12 — Início da Fase 1

- Node local: `v24.14.0`; pnpm: `11.7.0`.
- Registry oficial consultado; Next.js estável identificado: `16.2.10`; React escolhido: `19.2.7`.
- Scaffold oficial `create-next-app@16.2.10 --skip-install`: gerado temporariamente e usado como referência; temporário removido com caminho verificado.
- Docker e Supabase CLI: indisponíveis.
- `pnpm install`: falhou por timeout/ausência de progresso, sem lockfile ou node_modules.
- Lint/typecheck/test/build: não executáveis até a instalação concluir; não foram marcados como aprovados.

## 2026-07-12 — Recuperação do bootstrap

- Lockfile: gerado; 597 pacotes resolvidos e política de supply chain do pnpm aprovada.
- Dependências: 420 pacotes instalados; scripts nativos limitados por allowlist (`oxide`, `esbuild`, `sharp`, `unrs-resolver`).
- Dependências: duas subdependências transitivas depreciadas foram registradas como dívida; auditoria de vulnerabilidades ainda pendente.
- Formatação: executada com sucesso antes dos módulos de segurança adicionais.
- Build inicial: falhou porque Turbopack inferiu raiz pelo armazenamento externo; `turbopack.root` foi definido explicitamente.
- Lint inicial: falhou por resolução de peer dependency no armazenamento externo; dependências internas foram restauradas.
- Nova execução dos gates: pendente; aprovação fora do sandbox atingiu limite temporário da conta.
- Migration/RLS: não executados; Docker/Supabase local continuam ausentes.

## 2026-07-12 — Gates do checkpoint da Fase 1

- `pnpm format:check`: passou; todos os arquivos seguem Prettier.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou em TypeScript strict.
- `pnpm test`: 7 arquivos e 18 testes unitários passaram.
- `pnpm test:e2e`: 2/2 passaram no Chromium (landing/login e bloqueio sem sessão).
- `pnpm build`: passou com Next.js 16.2.10; rotas públicas/dinâmicas geradas.
- CI remoto do commit `aef748a`: falhou somente porque `next build` havia alterado `tsconfig.json` depois da formatação; causa confirmada nos logs do job `86671905101` e corrigida.
- Dev server: pronto em 8,4 s; sem deploy. O CLI `agent-browser` não estava instalado e o fallback persistente falhou por sandbox, mas o Playwright validou os fluxos reais.
- Migration/RLS/pgTAP: ainda não executados por ausência de Supabase descartável.

## 2026-07-12 — Checkpoint de autenticação segura

- `pnpm format`: passou.
- `pnpm format:check`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou em TypeScript strict.
- `pnpm test`: 9 arquivos e 22 testes unitários passaram.
- `pnpm build`: passou com Next.js 16.2.10; rotas `/forgot-password`, `/update-password` e `/auth/callback` incluídas.
- `pnpm test:e2e`: 4/4 passaram no Chromium usando servidor `next start` controlado por `scripts/run-e2e.mjs`.
- Tentativas anteriores de E2E com `webServer` automático do Playwright passaram os testes, mas travaram no encerramento do processo no Windows; o runner dedicado corrigiu o encerramento local.
- CI remoto passará a rodar E2E após o build; resultado remoto pendente até publicação do commit.
- Vercel remoto do commit `6b10dab` falhou procurando output `public` após `next build`; correção versionada em `vercel.json` para preset Next.js e output `.next`.
- Migration/RLS/pgTAP: ainda não executados por ausência de Supabase descartável.

## 2026-07-12 — Validação Supabase real

- Conexão direta IPv6 `db.dacittcezvtqljanhobb.supabase.co` falhou no ambiente local; o endpoint HTTP público respondeu, confirmando projeto ativo.
- Conexão via Session Pooler IPv4 foi usada com credencial temporária em variável de ambiente; nenhum segredo foi salvo em arquivo ou commit.
- `scripts/validate-phase1-supabase.mjs`: passou.
- Migration `supabase/migrations/202607120001_phase1_platform.sql`: aplicada no Supabase de teste autorizado.
- Validação RLS real: tenant A enxerga somente seu tenant; contexto do tenant B retorna `42501`; operação autorizada cria unidade; auto-bloqueio de membership retorna `42501`; audit log é append-only; membership bloqueada perde acesso.
- Dados fictícios de validação foram executados dentro de transação com rollback; schema/migration permanece aplicado para continuidade dos testes.
- pgTAP formal não foi executado porque a validação foi feita via script Node/Postgres sem Supabase CLI; cobertura equivalente dos cenários críticos foi registrada.

## 2026-07-12 — MFA/AAL2 e E2E autenticado real

- `scripts/run-e2e.mjs`: corrigido para repassar argumentos ao Playwright; permite rodar specs específicas.
- `scripts/seed-authenticated-e2e.mjs`: passou via Session Pooler IPv4 com credenciais temporárias em variáveis de ambiente; nenhum segredo foi salvo em arquivo.
- Seed autenticado: cria/atualiza usuário fictício, tenant, unidade base, membership ativa e papel `tenant_admin`; preserva `audit_logs` append-only e remove fatores MFA do usuário E2E para reprodutibilidade.
- Login Supabase Auth real: validado por E2E com usuário fictício e senha temporária.
- `pnpm test:e2e -- authenticated-workspace.spec.ts`: 1/1 passou no Chromium.
- Cenário autenticado coberto: login, seleção de tenant, acesso a `/app/security`, bloqueio de criação de unidade sem `aal2`, enrollment TOTP real, verificação do código, sessão reforçada e criação de unidade auditada.
- Durante o E2E, a função SQL `public.get_my_authorization_context` revelou ambiguidade de variável/coluna `membership_id`; a migration foi corrigida e a função foi atualizada no Supabase de teste.
- Observação: o SDK Supabase emite aviso interno sobre `getSession()` durante chamadas MFA; o código da aplicação usa `getUser()` na validação de sessão própria.

## 2026-07-12 — Gates finais do checkpoint MFA/AAL2

- `pnpm format`: passou.
- `pnpm format:check`: passou.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou em TypeScript strict.
- `pnpm test`: 10 arquivos e 24 testes unitários passaram.
- `node scripts/validate-phase1-supabase.mjs`: passou contra Supabase real via Session Pooler.
- `pnpm build`: passou com Next.js 16.2.10; rota `/app/security` incluída.
- `pnpm test:e2e -- public-and-auth.spec.ts`: 4/4 passaram no Chromium.
- `pnpm seed:e2e:auth` + `pnpm test:e2e -- authenticated-workspace.spec.ts`: seed passou e 1/1 E2E autenticado passou no Chromium com TOTP/AAL2 real.

## 2026-07-13 — Revisão visual/UX transversal (primeira unidade)

- `pnpm format:check`: passou; todos os arquivos seguem Prettier.
- `pnpm lint`: passou com zero warnings.
- `pnpm typecheck`: passou em TypeScript strict após normalizar relações Supabase tipadas como coleção em laboratório e financeiro.
- `pnpm test`: 27 arquivos e 91 testes passaram.
- `pnpm build`: passou com Next.js 16.2.10; as novas rotas de espirometria, diagnósticos, laboratório, documentos, financeiro e integrações foram compiladas.
- E2E integrado e acessibilidade visual autenticada permanecem na unidade seguinte, após seed estritamente fictício completo.

## 2026-07-13 — Seed fictício e E2E integrado preparados

- Seed autenticado ampliado com empresa, trabalhador, vínculo, PCMSO em rascunho, catálogo, encaminhamento, item, recurso e agendamento; todos possuem IDs fixos e nomes explicitamente fictícios.
- `node --check scripts/seed-authenticated-e2e.mjs`: passou.
- `pnpm format:check`, `pnpm lint` e `pnpm typecheck`: passaram.
- `pnpm test`: 27 arquivos e 91 testes passaram.
- `pnpm build`: passou com 26 páginas compiladas.
- `pnpm test:e2e`: 4 testes públicos passaram; o roteiro autenticado integrado foi carregado e ficou `skipped` por ausência das variáveis temporárias `E2E_AUTH_*`, `PG*` e Supabase nesta sessão.
- O seed não foi aplicado em banco externo nesta unidade; sua validação SQL real permanece pendente no Supabase de teste autorizado.
- `agent-browser` não está instalado; a verificação de navegador utilizou o runner Playwright do repositório.

## 2026-07-13 — Console operacional de espirometria

- Adicionados início de exame e registro de manobra com Server Actions, Zod, autorização `exams.manage`, AAL2 e RPCs transacionais existentes.
- Adicionado gate server-side que rejeita ordem cujo catálogo não seja do tipo `spirometry`.
- Teste de regressão cobre ordem de laboratório, catálogo ausente e ordem válida de espirometria.
- `pnpm format:check`, `pnpm lint` e `pnpm typecheck`: passaram.
- `pnpm test`: 27 arquivos e 92 testes passaram.
- `pnpm build`: passou com a rota dinâmica `/app/exams/spirometry`.
