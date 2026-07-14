# Fase atual

- Fase atual: **estabilização pós-checkpoints** (sem novas features de produto)
- Correção desta unidade: build Vercel — tipos de input Zod (`z.input` vs `z.infer`) em documentos e demais actions com campos `.default()`
- Correções anteriores:
  - `202607140023` aplicada (dono) — SST write-rpc-only + exame/agenda
  - `202607140024` — estrutura ocupacional + publicação PCMSO via RPC (hash SHA-256, expire sobreposição, DML revogado)
- Aplicar: `supabase/migrations/202607140024_stabilization_occupational_structure_pcmso_rpc.sql`
- Produção: **NO-GO** / PR #11 draft
- Branch: `feat/p0-2-consulta-operacional`
- Atualizado em: 2026-07-14
