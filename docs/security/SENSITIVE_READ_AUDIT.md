# Auditoria de leitura sensível

Auditar: visualização de prontuário/resultado, preview/download/URL assinada, impressão/reimpressão, exportação, busca por identificador sensível, break-glass, assinatura e retificação.

Metadados permitidos: tenant/unidade, ator, ação, tipo/ID opaco do recurso, request ID, data, resultado, AAL, justificativa e expiração. Não registrar CPF completo, anamnese, resultado, documento, token ou segredo.

## Checkpoint 2026-07-13 (código)

- RPC `log_sensitive_read` → `audit_logs` (ações allowlisted).
- RPC `log_document_access` → `document_access_logs` + espelho em `log_sensitive_read`.
- App: `src/features/audit/sensitive-read.ts`; consulta emite `chart.viewed`; lista de documentos emite `document.list_viewed`.
- Apply no Supabase autorizado e typegen oficial remoto ainda pendentes.
- Preview/download/print/signed URL de versão específica: chamar `recordDocumentAccess` nos fluxos de storage quando existirem.
