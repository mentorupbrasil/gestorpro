# Mapa de módulos

| Módulo | Depende de | Não pode depender de |
|---|---|---|
| platform/auth | Supabase Auth, memberships | módulos clínicos |
| permissions | platform/auth | UI |
| database | PostgreSQL/Drizzle | componentes React |
| occupational-health | permissions, database | billing para regra clínica |
| scheduling | occupational-health | clinical |
| encounters | occupational-health, scheduling | Realtime como estado |
| queues | encounters | display UI |
| clinical | encounters, exams, permissions | billing |
| exams | encounters, permissions | documentos |
| documents | clinical, exams, Storage | bucket público |
| billing | encounters, price snapshots | alterar protocolos |
| integrations | outbox/workflows | transação clínica aberta |
| observability | contratos redigidos | payload clínico bruto |

Módulos expõem portas de aplicação e tipos públicos mínimos. Persistência implementa interfaces dos domínios; UI chama casos de uso, nunca repositórios diretamente.
