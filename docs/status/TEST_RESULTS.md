# Resultados de testes e verificações

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
