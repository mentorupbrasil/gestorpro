# Fase atual

- Fase atual: **Fase F checkpoint** — check-in → etapas/fila a partir do protocolo do encaminhamento
- Entrega: RPC `check_in_appointment` reforçada (`202607140016`) — AAL2, `has_unit_permission`, etapa `exam` + `document`, filas recepção/triagem, snapshot com `examPreview`
- Dono: aplicar `supabase/migrations/202607140016_fase_f_checkin_protocol_flow.sql`
- Produção: **NO-GO**
- Branch: `feat/p0-2-consulta-operacional`
- Atualizado em: 2026-07-13
