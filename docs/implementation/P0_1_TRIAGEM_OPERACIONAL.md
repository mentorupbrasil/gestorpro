# P0.1 — Estação de triagem operacional

## Escopo entregue

- Substituição do campo `Payload JSON` por formulário estruturado para enfermagem.
- Fila operacional com atendimentos reais do banco (trabalhador, empresa, exame, espera, prioridade, unidade, etapa, pendências).
- Salvamento versionado em rascunho e conclusão com atualização da etapa `triage` e liberação da próxima etapa do roteiro.
- IMC recalculado no backend (`enrich_triage_payload` + validação TypeScript).
- Compatibilidade com payloads legados via normalização sem apagar campos desconhecidos.
- Autorização por tenant, unidade, MFA (AAL2) e permissões `clinical.read` / `triage.manage` / `clinical.reopen`.

## Arquivos principais

- `src/features/clinical/triage-payload.ts`
- `src/features/clinical/service.ts`
- `src/app/(protected)/app/clinical/triage-station.tsx`
- `supabase/migrations/202607140002_triage_operational_hardening.sql`
- `tests/unit/triage-payload.test.ts`

## Checklist de validação manual (ambiente autorizado)

1. Entrar como profissional com permissão `triage.manage` e MFA ativo.
2. Abrir `/app/clinical` e confirmar fila da unidade autorizada.
3. Selecionar atendimento com check-in real.
4. Preencher sinais vitais e antropometria.
5. Conferir prévia de IMC (valor oficial após salvar).
6. Salvar rascunho e confirmar badge de sucesso.
7. Recarregar a página e confirmar persistência dos campos.
8. Concluir triagem com motivo.
9. Confirmar etapa `triage` concluída e consulta liberada.
10. Confirmar evento/auditoria no ambiente autorizado.
11. Tentar acessar com usuário sem permissão (deve negar).
12. Tentar acessar atendimento de outro tenant (deve negar).

Não utilizar dados pessoais reais neste checklist.

## Limitações remanescentes

- Classificação auxiliar de IMC aguarda configuração aprovada no produto.
- Alertas clínicos configuráveis não foram adicionados nesta unidade.
- Impressão e histórico comparativo permanecem fora do escopo P0.1.
