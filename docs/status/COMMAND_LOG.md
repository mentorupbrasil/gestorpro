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
- Logs da Vercel consultados; falha remota causada por output directory `public` em projeto Next.js. Adicionado `vercel.json` com preset Next.js e saída `.next`.
- Diagnóstico de IPv6 da conexão direta Supabase e uso do Session Pooler IPv4.
- `node scripts/validate-phase1-supabase.mjs` executado com credenciais temporárias em variáveis de ambiente; validação de migration/RLS passou.

Saídas resumidas e resultados estão em `TEST_RESULTS.md`; valores de segredo nunca são registrados.

## 2026-07-13

- Consulta oficial da documentação técnica do eSocial em `https://www.gov.br/esocial/pt-br/documentacao-tecnica`.
- Versão registrada para Fase 10B: leiautes eSocial S-1.3 até NT 06/2026 rev. 09/04/2026; XSD S-1.3 produção em 27/04/2026; MOS S-1.3 consolidado até NO 11/2026.
- Fase 10B implementada sem credenciais, sem envio real e sem produção autorizada.
- Confirmada via Git/GitHub a ancestralidade integral de 16 branches históricas `feat/fase-*`; nenhuma era cabeça de PR aberta. Os atalhos remotos foram removidos, preservando `main`, a branch da PR #1, o checkpoint da Fase 11 e a revisão visual ativa.
- Fase A: `git fetch`, inventário Git/PR refs, fast-forward local para a branch contínua e scanners de código/SQL executados.
- Instalada Supabase CLI 2.109.1; executados format, lint, typecheck, unitários, secret scan, audit, build e E2E público.
- Consultadas referências públicas oficiais de SOC, RSData e Meddbase para benchmark, sem inferir ausência de funcionalidades não divulgadas.
- Iniciada consolidação Git solicitada pelo responsável: referências remotas sincronizadas e ancestralidade mapeada. A atualização de `main` e a remoção das três branches auxiliares ficam condicionadas a merge sem perda, gates locais e verificação remota de todos os commits.
- Merge de integração concluído sem conflitos; o arquivo exclusivo da antiga `main` foi preservado e todos os gates locais aplicáveis passaram antes de qualquer alteração remota.
- `main` atualizada por push normal, sem força, após comprovação de ancestralidade. As branches remotas `chore/fase-11-producao-piloto`, `codex/desenvolvimento-completo-unimetra` e `codex/revisao-visual-ux` foram removidas somente depois de confirmadas com zero commits exclusivos.
- Após a consolidação, o Dependabot criou nove branches automáticas de atualização de versão. A configuração foi ajustada e publicada com limite zero de PRs de versão, preservando atualizações de segurança; as nove branches automáticas existentes foram então removidas.
