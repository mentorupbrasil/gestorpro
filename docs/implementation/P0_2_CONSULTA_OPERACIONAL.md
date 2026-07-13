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

1. Concluir triagem de um atendimento fictício.
2. Abrir `/app/clinical?consultation=<encounter_id>`.
3. Confirmar fila de consulta e resumo da triagem.
4. Preencher campos SOAP e salvar rascunho.
5. Recarregar e confirmar persistência.
6. Concluir consulta com motivo e credencial médica válida.
7. Confirmar etapa `consultation` concluída e `exam` ou `document` liberada.
8. Confirmar evento/auditoria no ambiente autorizado.

## Limitações remanescentes

- Conclusão médica (P0.3) permanece em formulário inicial separado.
- Bloqueadores de conclusão (`computeConclusionBlockers`) ainda não integrados à UI.
- Migration pendente de aplicação sem `.env` local com Supabase autorizado.
