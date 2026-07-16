# Backup e recuperação

Antes de produção devem ser definidos e validados RPO/RTO, retenção e responsáveis.

## Configuração pretendida

| Item     | Valor alvo (documentar no GO)                               |
| -------- | ----------------------------------------------------------- |
| RPO      | ≤ 15 minutos (PITR)                                         |
| RTO      | ≤ 4 horas (restore ensaiado)                                |
| Banco    | PITR contratado + dump lógico criptografado externo semanal |
| Storage  | Inventário de buckets privados + replicação versionada      |
| Retenção | 30 dias hot / 180 dias cold (ajustar com jurídico)          |

## Scripts locais (ambiente de teste)

```bash
# Dump lógico (teste; nunca comitar o arquivo)
pg_dump "$DATABASE_URL" --format=custom --file=backup-test.dump

# Restore em banco descartável
createdb gestorpro_restore_smoke
pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" backup-test.dump

# Verificação mínima pós-restore
psql "$RESTORE_DATABASE_URL" -c "select count(*) from public.tenants;"
psql "$RESTORE_DATABASE_URL" -c "select count(*) from public.encounters;"
```

Storage: listar objetos do bucket `clinical-private` e comparar hashes persistidos em `document_versions.content_hash` com bytes baixados via service role **somente em ambiente de teste**.

## Contingência offline

1. Exportar fila local (CSV de tickets waiting/called) pela estação de recepção.
2. Registrar atendimentos em papel com IDs opacos gerados offline.
3. Após reconexão, reconciliar via check-in idempotente + adendos clínicos (sem overwrite).

## Estado de validação

- Restore de teste automatizado no CI: **ainda não** (requer Postgres efêmero + secrets).
- Não declarar backup validado sem executar restore isolado e registrar evidência em `TEST_RESULTS.md`.
- Nenhuma rotina de produção sem autorização humana (`HUMAN_ACTIONS.md`).
