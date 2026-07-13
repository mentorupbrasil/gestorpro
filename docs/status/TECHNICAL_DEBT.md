# Dívida técnica

Pendências deliberadas: validar sintaxe DBML/Mermaid com ferramentas dedicadas; confirmar versões e custos dos provedores; expandir dicionário por coluna junto às migrations; converter ADRs propostos em aceitos somente após revisão humana/técnica.

## Fase 1

- Ambiente atual não possui Docker/PostgreSQL local; SQL e RLS da nova migration ainda carecem de execução real.
- Supabase CLI 2.109.1 foi instalada; tipos oficiais ainda não existem porque falta projeto autorizado com schema completo.
- A topologia OneDrive exige execução fora do sandbox para ferramentas em `node_modules`; registrar uma configuração local reproduzível sem caminho absoluto antes do fechamento.
- Duas subdependências de tooling permanecem depreciadas (`@esbuild-kit/core-utils` e `@esbuild-kit/esm-loader`), mas o esbuild vulnerável foi substituído por override corrigido; remover a cadeia quando o Drizzle eliminar a dependência.

## Revisão geral pós-checkpoints — 2026-07-13

- Completar telas operacionais das fases 7C–10: espirometria, exames diagnósticos, laboratório, documentos, financeiro/portal empresarial e integrações.
- Criar seed fictício abrangente e idempotente para demonstração e E2E integrado.
- Criar E2E ponta a ponta do fluxo central do MVP.
- Executar validação SQL completa de todas as migrations em banco descartável.
- Gerar typegen oficial Supabase quando a CLI estiver disponível.
- Rodar teste de carga, concorrência, acessibilidade e backup/restore antes de qualquer GO.
