# Dicionário de dados inicial

O DBML é conceitual e será decomposto em migrations pequenas na Fase 1. Campos comuns: UUID, timestamps UTC, `tenant_id`, autoria e `version` otimista. Exclusão física é proibida para histórico clínico e documentos emitidos.

| Grupo | Tabelas iniciais | Sensibilidade | Retenção/imutabilidade |
|---|---|---|---|
| Plataforma | tenants, clinic_units, memberships, roles | interna | histórico de acesso auditável |
| Identidade ocupacional | companies, workers, employment_contracts | pessoal/sensível | política LGPD pendente; vínculos versionados |
| Protocolos | pcmso_versions, exam_protocols/items | técnica/ocupacional | versão usada é imutável |
| Operação | referrals, appointments, encounters, steps | pessoal/operacional | eventos e snapshots preservados |
| Clínico | exam_orders/results, medical_conclusions | saúde sensível | sem delete comum; acesso mínimo |
| Documentos | generated_documents, document_versions | saúde sensível | emissão imutável, retificação por nova versão |
| Governança | audit_logs, idempotency_keys, outbox_events | interna | auditoria append-only e payload redigido |

CPF/CNPJ devem ser normalizados; para busca de identificador sensível, avaliar criptografia de coluna mais hash de busca com chave separada. JSONB é reservado a snapshots, condições versionadas e payloads, não substitui modelagem relacional.
