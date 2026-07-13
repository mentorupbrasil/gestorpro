# Status mestre

Atualizado em: 2026-07-13

## Reauditoria V2

- Fase A — Reauditoria e correção da fundação: `PARTIAL / IN_PROGRESS`.
- Os checkpoints históricos das Fases 1–11 permanecem preservados, mas não equivalem a aceite técnico pelos gates do Plano Mestre V2.
- Produção e merge na `main`: não autorizados.
- Primeira unidade: contenção de DML/RPC, escopo por unidade, AAL2 no banco, último admin, supply chain e documentos obrigatórios concluídos localmente.
- Gate fechado nesta unidade: typegen oficial remoto (Management API + fingerprint OK).
- Governança: repositório tornado **private** em 2026-07-13 (`mentorupbrasil`).
- P0.4 lote clínico: FKs compostas aplicadas e negativas OK no banco autorizado (2026-07-13).
- Gates ainda abertos: ondas restantes de integridade composta, revisão Vercel/segredos, rotação do token vazado, CI verde na feature branch.
- Pedido de GO/produção (2026-07-13): registrado; deploy/dados reais permanece **NO-GO** até fechar revisão de acessos/chaves.
- Checklists manuais P0.1–P0.3 com MFA: fechados em 2026-07-13 no Supabase autorizado.
- RLS/bypass negativos e phase1: revalidados no Session Pooler.

| Fase                         | Estado                | Observação                                         |
| ---------------------------- | --------------------- | -------------------------------------------------- |
| 0 — Fundação documental      | TECHNICALLY_COMPLETED | auditoria aprovada; ADRs permanecem PROPOSTA       |
| 1 — Plataforma e segurança   | REAUDIT_IN_PROGRESS   | typegen oficial ok; governança remota ainda aberta |
| 2 — Domínio ocupacional      | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                 |
| 3 — Encaminhamentos e agenda | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                 |
| 4 — Check-in, etapas e filas | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                 |
| 5 — Painel de chamadas       | CHECKPOINT_PUBLISHED  | revisão final posterior solicitada                 |
| 6 — Triagem e consulta       | CHECKPOINT_PUBLISHED  | validação clínica futura                           |
| 7 — Exames complementares    | CHECKPOINT_PUBLISHED  | validação profissional futura                      |
| 8 — Documentos               | CHECKPOINT_PUBLISHED  | modelos/assinatura dependem de humanos             |
| 9 — Financeiro e portal      | CHECKPOINT_PUBLISHED  | validação contábil/jurídica futura                 |
| 10 — Integrações             | CHECKPOINT_PUBLISHED  | eSocial oficial consultado; sem envio real         |
| 11 — Produção e piloto       | CHECKPOINT_PUBLISHED  | relatório NO-GO publicado; revisão geral iniciada  |

Revisão geral pós-checkpoints: `IN_PROGRESS`. Primeira unidade visual validada; seed fictício e E2E integrado preparados, com execução autenticada externa pendente. Ver [GENERAL_AUDIT_20260713.md](GENERAL_AUDIT_20260713.md).

Branch remota atual: `main`. Em 2026-07-13, os históricos divergentes foram unidos por merge sem conflitos, validados localmente e publicados sem força; as três branches auxiliares remotas foram removidas somente após comprovação de ancestralidade integral.
