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

## Resultado da validação (2026-07-13)

**Bloqueio:** ausência de `.env` local e de variáveis `PGHOST` / `DATABASE_URL` / `MIGRATION_DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` no ambiente. Apenas `.env.example` está presente no repositório. Migration `202607140002` não foi aplicada; checklist manual não executado.

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | Login com `triage.manage` + MFA | Bloqueado | Requer Supabase autorizado e credenciais locais |
| 2 | Fila em `/app/clinical` | Bloqueado | Requer app + banco com atendimentos |
| 3 | Selecionar atendimento com check-in | Bloqueado | Requer dados de teste no ambiente autorizado |
| 4 | Preencher sinais vitais e antropometria | Bloqueado | Requer UI em runtime |
| 5 | Prévia de IMC | Bloqueado | Requer salvamento no banco (`enrich_triage_payload`) |
| 6 | Salvar rascunho | Bloqueado | RPC `save_triage_record` não aplicada no banco |
| 7 | Persistência após reload | Bloqueado | Requer banco aplicado |
| 8 | Concluir triagem com motivo | Bloqueado | Requer banco aplicado |
| 9 | Etapa `triage` concluída / consulta liberada | Bloqueado | Requer banco aplicado |
| 10 | Evento/auditoria | Bloqueado | Requer banco aplicado |
| 11 | Usuário sem permissão negado | Bloqueado | Código mapeia `42501` em `service.ts`; validação real pendente |
| 12 | Outro tenant negado | Bloqueado | RLS/RPC no SQL; validação real pendente |

**Comando:** `pnpm validate:supabase:triage` (requer `.env` com Supabase autorizado).

## Limitações remanescentes

- Classificação auxiliar de IMC aguarda configuração aprovada no produto.
- Alertas clínicos configuráveis não foram adicionados nesta unidade.
- Impressão e histórico comparativo permanecem fora do escopo P0.1.
