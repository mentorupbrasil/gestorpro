# Bloqueios

## Fase A — governança remota

- Repo **private**. CI da feature: **success** (run após fix fingerprint).
- Pendente humano: rotacionar `SUPABASE_ACCESS_TOKEN` vazado; revisar Vercel env vars.
- GO produção: **NO-GO** (sem merge de produção / dados reais).

## Fase A — técnica

- P0.1–P0.3 checklists MFA: fechados.
- Typegen oficial: fechado.
- P0.4 FKs compostas (ondas 1–3): aplicadas no banco autorizado.
