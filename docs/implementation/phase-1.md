# Execução da Fase 1 — Plataforma, segurança e isolamento

## Escopo autorizado

Bootstrap Next.js/TypeScript, qualidade/CI, Supabase SSR, estrutura de plataforma, memberships, RBAC, autorização server-side, RLS, auditoria append-only, request ID e erros públicos. Entidades ocupacionais e clínicas permanecem fora desta fase.

## Incrementos

1. Bootstrap reproduzível, lockfile e gates locais.
2. Configuração validada e clientes inicializados sob demanda.
3. Autenticação SSR e seleção explícita de tenant revalidada no servidor.
4. Entidades de plataforma e RBAC.
5. Migration com constraints, RLS e função de contexto autorizado.
6. Auditoria append-only e resposta de erro com request ID.
7. Testes unitários, integração, RLS, E2E de login/isolamento e build.

## Riscos e rollback

- Nenhuma migration será aplicada fora de banco descartável nesta fase.
- Docker/Supabase local ausentes bloqueiam validação real de SQL/RLS.
- Arquivos de bootstrap permanecem sem commit até os gates executarem.
- Rollback pré-commit: preservar arquivos e corrigir; não resetar nem apagar histórico.
