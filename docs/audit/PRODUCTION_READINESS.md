# Prontidão para produção

Decisão atual: **NO-GO**.

## Bloqueadores técnicos

- typegen oficial ausente e cliente Supabase ainda não tipado pelo schema gerado;
- migration de hardening sem execução em PostgreSQL real;
- integridade composta multi-tenant incompleta;
- CI remoto atual e estado draft do PR não confirmados nesta sessão;
- E2E autenticado e fluxo ponta a ponta não executados;
- carga, concorrência, acessibilidade, pentest e backup/restore pendentes;
- supply chain ainda sem CodeQL, dependency review, SBOM, licença e actions pinadas por SHA.

## Bloqueadores humanos

Repositório privado/governança, LGPD/retenção, regras clínicas, documentos/assinatura, financeiro, eSocial, integrações, RPO/RTO, piloto e autorização formal.

Nenhum deploy de produção deve ocorrer enquanto qualquer item crítico estiver aberto.
