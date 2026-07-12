# Estratégia de migrations

- Drizzle gera artefatos revisáveis; SQL é versionado e nunca aplicado diretamente em produção pelo navegador.
- Uma mudança lógica por migration, com FK, checks, índices e RLS na mesma unidade segura quando possível.
- Testes usam PostgreSQL descartável e executam do zero e de versão anterior suportada.
- Mudanças incompatíveis seguem expand/contract: adicionar, backfill idempotente em lotes, leitura dupla/compatível, trocar escrita, observar e só depois remover em fase autorizada.
- Nenhum drop, truncate, cascade destrutivo, alteração irreversível de tipo ou backfill sem plano, backup e validação.
- Cada migration documenta pré-condições, impacto de lock, rollback/roll-forward e verificação pós-aplicação.
- Produção exige backup verificado, janela, responsável e autorização humana.
