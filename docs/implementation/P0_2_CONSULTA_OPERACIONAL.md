# P0.2 — Estação de consulta médica operacional

## Escopo entregue

- Substituição do formulário JSON de consulta por campos SOAP estruturados.
- Fila operacional com atendimentos com triagem concluída e etapa `consultation` disponível.
- Salvamento versionado em rascunho e conclusão via RPC `save_medical_consultation`.
- Resumo read-only da triagem no painel lateral.
- Validação de credencial médica do usuário logado, AAL2 e `consultations.manage` por unidade.
- Liberação de etapa `exam` ou `document` ao concluir consulta conforme exames pendentes.

## Arquivos principais

- `src/features/clinical/consultation-payload.ts`
- `src/features/clinical/service.ts` (`loadConsultationWorkspace`, `saveMedicalConsultation`)
- `src/app/(protected)/app/clinical/consultation-station.tsx`
- `supabase/migrations/202607140003_consultation_operational_hardening.sql`
- `tests/unit/consultation-payload.test.ts`

## Checklist de validação manual (ambiente autorizado)

1. Concluir triagem de um atendimento fictício. ✅
2. Abrir `/app/clinical?consultation=<encounter_id>`. ✅
3. Confirmar fila de consulta e resumo da triagem. ✅ (PA/IMC visíveis)
4. Preencher campos SOAP e salvar rascunho. ✅ (fluxo direto para conclusão)
5. Recarregar e confirmar persistência. ✅ (versão/consulta fechada)
6. Concluir consulta com motivo e credencial médica válida. ✅ MFA/AAL2
7. Confirmar etapa `consultation` concluída e `exam` ou `document` liberada. ✅ `document` available
8. Confirmar evento/auditoria no ambiente autorizado. ✅ `consultation.completed`

## Resultado da validação (2026-07-13)

**P0.2 fechado:** sim, no Tenant E2E com MFA.

## Limitações remanescentes

- Nenhuma crítica para o escopo P0.2.
