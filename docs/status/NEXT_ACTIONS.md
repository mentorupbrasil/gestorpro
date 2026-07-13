# Próximas ações

1. Configurar `.env` com credenciais do Supabase autorizado e executar `pnpm validate:supabase:triage` (aplica migration + checklist SQL fictício).
2. Executar checklist manual de triagem em `docs/implementation/P0_1_TRIAGEM_OPERACIONAL.md` (UI).
3. Gerar tipos oficiais contra schema completo e executar testes negativos de bypass no PostgreSQL.
4. Executar os testes PostgreSQL de DML direto, AAL1, unidade A/B, último administrador, auditoria e membership bloqueada.
5. Não iniciar a Fase B enquanto qualquer gate da Fase A permanecer aberto.
