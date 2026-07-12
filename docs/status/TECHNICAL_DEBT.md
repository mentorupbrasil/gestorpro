# Dívida técnica

Nenhuma dívida de código: ainda não existe código funcional.

Pendências deliberadas: validar sintaxe DBML/Mermaid com ferramentas dedicadas; confirmar versões e custos dos provedores; expandir dicionário por coluna junto às migrations; converter ADRs propostos em aceitos somente após revisão humana/técnica.

## Fase 1

- Ambiente atual não possui Docker/Supabase CLI; SQL e RLS ainda carecem de execução real.
- Tipos gerados do Supabase ainda não existem; devem ser gerados após migration validada.
- A topologia OneDrive exige execução fora do sandbox para ferramentas em `node_modules`; registrar uma configuração local reproduzível sem caminho absoluto antes do fechamento.
- O pnpm reportou duas subdependências depreciadas transitivas (`@esbuild-kit/core-utils` e `@esbuild-kit/esm-loader`); identificar a cadeia e atualizar/mitigar antes do aceite.
