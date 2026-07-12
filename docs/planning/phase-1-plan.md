# Plano detalhado da Fase 1

1. Confirmar ADRs e versões estáveis em documentação oficial; registrar lock-in/custo.
2. Inicializar workspace mínimo Next.js/TypeScript strict e gerenciador com lockfile.
3. Configurar formatação, lint, Vitest, Playwright e CI.
4. Criar limites modulares de database, auth, permissions, observability e testing.
5. Documentar variáveis por nome e ambientes; criar exemplos sem valores reais.
6. Preparar Supabase local e Drizzle; primeira migration apenas de plataforma.
7. Implementar tenants, units, profiles e memberships com constraints.
8. Implementar roles/permissions/escopos e resolução server-side do contexto.
9. Criar RLS para todas as tabelas da fase e suíte tenant A/B.
10. Implementar autenticação, bloqueio de usuário e preparação de MFA crítico.
11. Implementar request ID, erro padronizado, redaction e auditoria append-only.
12. Criar UI mínima de login/contexto e estados loading/empty/error/denied.
13. Executar migration limpa, unitários, integração, RLS, E2E, build, segredos e dependências.
14. Auditar critérios, atualizar status e registrar decisões/rollback.

Não entram empresas, trabalhadores, PCMSO, agenda ou qualquer módulo clínico.
