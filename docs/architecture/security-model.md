# Modelo de segurança

## Defesa em profundidade

1. Sessão autenticada e MFA/AAL para ações críticas.
2. Membership ativa resolve tenant e escopos no servidor.
3. Permissão granular é avaliada no caso de uso.
4. Query aplica tenant/unidade/empresa explicitamente.
5. RLS reforça isolamento no PostgreSQL.
6. DTO seleciona somente campos autorizados.
7. Auditoria append-only registra ação sensível sem conteúdo clínico desnecessário.

## Regras

- `tenant_id` do payload é ignorado/rejeitado; contexto vem da sessão.
- Service role existe somente em runtime server-side restrito.
- Storage clínico usa bucket privado, caminho opaco e URL assinada curta.
- Logs recebem request ID, código e metadados redigidos, nunca CPF, diagnóstico, resultado ou documento.
- Acesso emergencial requer justificativa, expiração, alerta e revisão.
- Sessões de usuário bloqueado são invalidadas.
- Segredos ficam em gerenciadores de ambiente, com rotação e mínimo privilégio.

## Limites de confiança

Navegador, painel, webhooks e conector local são não confiáveis. Todo comando é autenticado, autorizado, validado, idempotente quando necessário e reconciliado com o banco.
