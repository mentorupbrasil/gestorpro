# PR principal — descrição proposta

## Resumo

Reauditoria da fundação Unimetra conforme Plano Mestre V2, com contenção fail-closed de mutações inseguras, separação de escopo tenant/unidade, hardening AAL2, proteção do último administrador, supply chain e documentação real do estado.

## Arquitetura e migrations

- monólito modular Next.js/Supabase preservado;
- nova migration `202607130006_phase_a_foundation_hardening.sql`;
- DML direto revogado; RPCs históricas congeladas até reauditoria;
- autorização por tenant/unidade/empresa/profissional/atendimento/documento.

## Segurança

- AAL2 validado no banco para RPCs administrativas endurecidas;
- permissão de unidade não é tenant-wide;
- último admin ativo protegido;
- CodeQL, dependency review, Dependabot, secret scan, audit e actions pinadas.

## Testes

- format, lint, TypeScript e 100 unitários verdes;
- build com 26 rotas verdes;
- E2E público 4/4; autenticado ignorado por ausência de credenciais temporárias;
- auditoria de dependências: zero vulnerabilidades após overrides.

## Riscos, bloqueios e limitações

- typegen oficial/cliente tipado pendente;
- migration/RLS/bypass sem execução PostgreSQL real nesta rodada;
- integridade composta multi-tenant pendente;
- RPCs de checkpoints posteriores permanecem congeladas;
- produção e merge proibidos.

## Validações humanas e ambiente

Repositório privado/governança, LGPD, clínica, assinatura, financeiro, eSocial, integrações, backup/restore, pentest e piloto. Usar somente dados fictícios e ambientes separados; nenhuma credencial deve ser persistida.
