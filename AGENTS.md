# Instruções permanentes do projeto

Antes de agir, leia integralmente a especificação-mestre, o guia, o Plano Mestre V2, `docs/status/MASTER_STATUS.md`, `CURRENT_PHASE.md`, `BLOCKERS.md`, `NEXT_ACTIONS.md` e ADRs relevantes.

- Nunca trabalhar diretamente na `main`, apagar histórico, usar dados reais, versionar `.env` ou segredos, desativar RLS, confiar em `tenant_id` do cliente, automatizar aptidão ou expor documento clínico.
- Preservar mudanças locais desconhecidas e evitar comandos destrutivos.
- Implementar em monólito modular, com TypeScript estrito, Zod, autorização server-side, RLS, auditoria, transações e testes proporcionais ao risco.
- Atualizar os arquivos de `docs/status/` antes e depois de cada unidade relevante.
- Uma fase só avança após auditoria e critérios técnicos atendidos. O briefing de execução contínua de 12/07/2026 autoriza avanço entre fases técnicas, mas não deploy, produção, decisão clínica/jurídica/regulatória ou ação irreversível.
