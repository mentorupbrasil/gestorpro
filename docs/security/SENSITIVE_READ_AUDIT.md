# Auditoria de leitura sensível

Auditar: visualização de prontuário/resultado, preview/download/URL assinada, impressão/reimpressão, exportação, busca por identificador sensível, break-glass, assinatura e retificação.

Metadados permitidos: tenant/unidade, ator, ação, tipo/ID opaco do recurso, request ID, data, resultado, AAL, justificativa e expiração. Não registrar CPF completo, anamnese, resultado, documento, token ou segredo.

`document_access_logs` cobre parte de preview/download/print/signed URL. Prontuário, resultado e pesquisa ainda precisam de RPCs de leitura auditada; SELECT genérico não satisfaz o requisito.
