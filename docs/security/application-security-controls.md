# Controles de segurança da aplicação — Fase 1

- Autenticação: Supabase Auth SSR; sessão é revalidada com `getUser`, e proxy não é gate único.
- Autorização: permissão server-side antes do caso de uso e nova validação transacional na função SQL.
- Tenant: cookie indica seleção, mas o servidor resolve e valida membership ativa; nenhum `tenant_id` do formulário é confiado.
- Sessão: cookies definidos pelo provedor e seleção de tenant `httpOnly`, `sameSite=lax`, `secure` em produção.
- MFA: ações críticas dispõem de gate `aal2`; fluxos de enrollment/política dependem do ambiente Supabase.
- Headers: frame denial, MIME sniffing denial, referrer restrito e permissões de navegador fechadas por padrão.
- CSRF: Server Actions/origin checks do Next.js e cookies SameSite; Route Handlers mutáveis deverão validar origem/nonce conforme contrato.
- Logs: contrato operacional limitado a IDs/códigos/tempo; conteúdo clínico e identificadores pessoais não são aceitos.
- Rate limit: limites nativos do Supabase Auth serão confirmados no ambiente; limites adicionais não serão simulados em memória.
- Segredos: somente variáveis server-side; publishable key é pública por definição; service role nunca entra no browser.
