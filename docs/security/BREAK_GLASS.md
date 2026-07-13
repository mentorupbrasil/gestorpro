# Acesso emergencial (break-glass)

Estado: contrato de segurança definido; implementação bloqueada até validação jurídica/LGPD e de segurança.

Requisitos mínimos:

1. identidade ativa, AAL2 e permissão específica não herdada de admin técnico;
2. recurso e finalidade explícitos, justificativa obrigatória e prazo curto;
3. concessão server-side/RPC transacional, nunca por campo do cliente;
4. alerta imediato a responsáveis independentes;
5. auditoria de concessão, cada leitura/download e encerramento, sem conteúdo clínico bruto;
6. revogação automática e revisão posterior obrigatória;
7. relatório de exceção e teste periódico.

Sem esses controles, o acesso deve falhar fechado.
