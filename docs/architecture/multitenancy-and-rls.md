# Multitenancy e estratégia de RLS

## Modelo

Banco compartilhado e schema compartilhado. Tabelas de negócio possuem `tenant_id NOT NULL`; tabelas globais são excepcionais e documentadas. Índices e uniques começam pelo tenant quando aplicável.

## Contexto confiável

O backend resolve `user_id`, `tenant_id`, `clinic_unit_ids`, `company_ids`, permissões e AAL a partir da sessão e memberships ativas. Nenhum escopo é aceito diretamente do cliente.

## Política-base

- `SELECT`: membership ativa + escopo + permissão de leitura.
- `INSERT`: tenant derivado do contexto e `WITH CHECK` correspondente.
- `UPDATE`: mesma visibilidade + permissão + controle otimista de versão.
- `DELETE`: proibido para dados clínicos/históricos; uso administrativo restrito apenas onde documentado.
- service role: somente jobs internos mínimos, nunca browser.

## Testes obrigatórios

Tenant A/B, membership inativa, unidade fora do escopo, empresa fora do escopo, permissão insuficiente, sessão ausente, elevação de privilégio e service-role leakage. RLS complementa, não substitui, autorização de aplicação.
