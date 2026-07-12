# Log de comandos relevantes

## 2026-07-12

- Inspeção Git, inventário e scanner de segredos.
- `git fetch --prune origin`.
- `git merge --ff-only origin/main`.
- criação/switch para `codex/desenvolvimento-completo-unimetra`.
- leitura integral e inventário de títulos das fontes.
- consulta de versões no registro oficial e scaffold `create-next-app@16.2.10 --skip-install`.
- geração isolada do lockfile e instalação com allowlist de scripts nativos.
- formatação inicial; build/lint diagnósticos registrados em `TEST_RESULTS.md`.
- scanners estáticos de segredos, marcadores, `tenant_id`, fronteiras server-only e `git diff --check`.
- `pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` para o checkpoint de autenticação segura.
- Diagnóstico do travamento do Playwright `webServer` no Windows e validação do runner dedicado `scripts/run-e2e.mjs`.
- CI atualizado para instalar Chromium do Playwright e executar `pnpm test:e2e` após `pnpm build`.

Saídas resumidas e resultados estão em `TEST_RESULTS.md`; valores de segredo nunca são registrados.
