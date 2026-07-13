# Próximas ações

1. Aplicar todas as migrations em Supabase de teste autorizado e gerar os tipos oficiais com credenciais temporárias.
2. Executar os testes PostgreSQL de DML direto, AAL1, unidade A/B, último administrador, auditoria e membership bloqueada.
3. Criar e validar constraints compostas `(tenant_id, id)`/FKs multi-tenant após inspecionar o schema real.
4. Reexecutar E2E autenticado, CI e confirmar PR #1 como draft com a descrição preparada em `docs/audit/PR_MAIN_DESCRIPTION.md`.
5. Não iniciar a Fase B enquanto qualquer gate da Fase A permanecer aberto.
