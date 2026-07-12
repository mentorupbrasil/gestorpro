# ADR-0007 — Fronteiras de autenticação e acesso ao banco

**Status:** PROPOSTA

## Decisão

- Supabase Auth SSR mantém a sessão; `proxy.ts` renova cookies, mas não autoriza sozinho.
- Cada página/caso de uso protegido revalida usuário e resolve contexto por membership ativa.
- Seleção de tenant pode vir do usuário/cookie, porém só se torna contexto confiável após RPC server-side validar membership, perfil, validade, papéis e escopos.
- Operações de usuário passam por autorização de aplicação e RPC transacional protegida por RLS/permissão.
- Conexão PostgreSQL direta fica reservada a migrations, jobs internos e repositórios que usem papel limitado/RLS configurado; não recebe escopo livre do navegador.
- Service role fica somente em provisioning/job server-only, com funções explicitamente concedidas e nunca no bundle cliente.

## Consequências

Há defesa em profundidade e auditoria atômica, ao custo de contratos RPC e testes RLS obrigatórios. Tipos Supabase serão gerados após a primeira migration validada.
