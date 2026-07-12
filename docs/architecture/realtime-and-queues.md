# Realtime e filas

Chamadas e atualizações de fila são persistidas antes da publicação. PostgreSQL guarda o estado; Supabase Realtime Broadcast distribui payload mínimo em canal privado por tenant/unidade. Reconciliação periódica e carregamento inicial recuperam o estado após desconexão.

Uma chamada usa atualização condicional/lock transacional para impedir que duas salas assumam o mesmo ticket. Eventos têm ID, versão e deduplicação. Painéis usam credencial de dispositivo revogável, heartbeat e escopo mínimo; não recebem CPF, empresa, exame, diagnóstico ou resultado.

Redis pode apoiar rate limit, nonce e locks curtos, mas nunca substituir `queue_tickets`, `call_events` ou `call_deliveries`.
