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
