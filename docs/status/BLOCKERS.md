# Bloqueios

## Fase A — governança remota

- Repo **private**. CI da feature falhou no último push por fingerprint de types desatualizado — corrigido localmente (precisa novo commit/push).
- Pendente: rotacionar `SUPABASE_ACCESS_TOKEN` vazado; revisar Vercel.
- GO produção: **NO-GO**.

## Fase A — integridade multi-tenant

- P0.4 ondas 1–3 aplicadas no banco autorizado:
  - `202607140007` clínico
  - `202607140008` empresa/agenda
  - `202607140009` exames/filas/financeiro
- Types/fingerprint regenerados localmente.
