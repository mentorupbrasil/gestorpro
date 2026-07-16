# P0.4 — Integridade referencial multi-tenant (lote clínico)

## Objetivo

Impedir relacionamento cruzado entre tenants nas entidades clínicas centrais com:

- `UNIQUE (tenant_id, id)` nos pais
- `FOREIGN KEY (tenant_id, filho_id) REFERENCES pai (tenant_id, id)` nos filhos

## Escopo deste lote

Pais: `clinic_units`, `workers`, `encounters`, `triage_form_versions`, `triage_records`, `clinical_professional_credentials`, `medical_consultations`, `document_template_versions`.

Filhos/vínculos: encounters→worker/unit; triage; consultation; conclusion; generated_documents.

Migration: `supabase/migrations/202607140007_p0_4_composite_tenant_fks_clinical.sql`.

## Validação

1. `npm run validate:supabase:composite-fk` — preflight de mismatches
2. `node scripts/apply-p0-4-composite-fks.mjs --dry-run` — aplica e dá rollback
3. `npm run migrate:p0-4:composite-fk` — aplica no Supabase autorizado
4. `npm run validate:supabase:composite-fk:negatives` — insert cruzado deve falhar

## Estado

- Aplicado no banco autorizado em 2026-07-13 (sem Docker; dry-run + dados fictícios limpos).
- Lotes seguintes (empresa/contrato/agenda/financeiro) ficam para ondas posteriores.
- FKs simples por `id` foram mantidas; compostas adicionam a proteção de tenant.
