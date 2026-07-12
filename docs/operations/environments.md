# Ambientes e configuração

| Ambiente   | Dados                             | Banco/Storage              | Integrações                  | Deploy             |
| ---------- | --------------------------------- | -------------------------- | ---------------------------- | ------------------ |
| local      | sintéticos                        | Supabase local descartável | desligadas/sandbox           | nenhum             |
| test       | sintéticos efêmeros               | isolado e recriável        | stubs de contrato explícitos | CI                 |
| preview    | sintéticos                        | projeto isolado            | sandbox                      | por PR             |
| staging    | sintéticos/homologação autorizada | separado de produção       | sandbox homologado           | aprovação          |
| production | reais autorizados                 | projeto dedicado/backup    | credenciais reais em cofre   | autorização formal |

Variáveis são documentadas somente por nome em `.env.example`. `NEXT_PUBLIC_*` pode chegar ao navegador e nunca contém segredo. `DATABASE_URL` usa papel runtime limitado; `MIGRATION_DATABASE_URL` usa papel separado e só existe em jobs de migration. Service role, certificados e tokens são server-only e ficam no gerenciador do ambiente. O código inicializa clientes sob demanda para que o build não dependa de credenciais runtime.
