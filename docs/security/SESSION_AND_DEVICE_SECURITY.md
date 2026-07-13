# Segurança de sessão e dispositivo

- sessão renovada por Supabase SSR; proxy não é autorização;
- toda página, ação e handler protegido revalida usuário/contexto;
- AAL2 é exigido também no banco para mutações administrativas endurecidas;
- membership bloqueada perde autorização/RLS imediatamente;
- revogação global de refresh tokens ao bloquear usuário requer fluxo server-only com Supabase Admin e teste real;
- painel/conector usam identidade de dispositivo, escopo mínimo, rotação, expiração, heartbeat e revogação;
- nenhum token de dispositivo pode aparecer em log, URL ou código-fonte.

Estado: sessão humana parcial; revogação global e lifecycle de dispositivos permanecem pendentes.
