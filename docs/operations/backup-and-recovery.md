# Backup e recuperação

Antes de produção devem ser definidos e validados RPO/RTO, retenção e responsáveis. Plano pretendido: PITR contratado para PostgreSQL, dump lógico criptografado externo, inventário/replicação versionada de Storage e verificação de hashes.

Restauração será ensaiada em ambiente isolado, incluindo banco, objetos, vínculos, permissões e smoke tests. Backup de banco não é considerado backup de Storage. Evidências registram data, ponto restaurado, duração, perdas, hashes e aprovação. Nenhuma rotina real será configurada sem credenciais, custo e autorização humana.
