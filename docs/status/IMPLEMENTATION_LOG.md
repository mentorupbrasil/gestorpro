# Log de implementação

## 2026-07-14 — páginas protegidas: falhas de carregamento visíveis

- Páginas operacionais convertem falhas de autorização, consultas Supabase e Zod em `PageLoadError` (sem error boundary genérico).
- Schemas passam a aceitar embeds PostgREST como objeto **ou** array (`embeddedOneSchema`); `display_name`/`content_hash` nulos deixam de derrubar a tela.
- Clínica e portal capturam falhas de workspace/overview; teste unitário do embed.
- Validação: `tsc --noEmit` + vitest `embedded-relation` / `platform-schemas` OK.

## 2026-07-14 — polimento de layout (shell)

- Shell grafite recolhível (~240 px), topbar compacta (unidade/org, busca visual, alertas, perfil).
- Menu por grupos; **Exames** expansível; SST removido do menu (sem duplicata).
- Tokens CSS estilo Supabase + Geist Sans; overview usando `PageHeader`/`Surface`/tabela densa.
- Sem mudança de regra de negócio/banco.

## 2026-07-14 — remove Demo da UX operacional

- Removidos: seção “Ambientes de teste” no select-tenant, banner “Dados fictícios…”, script `seed-clinical-demo` / `pnpm seed:clinical:demo`.
- Tenants E2E/TEST/DEMO ficam ocultos na seleção (não aparecem como “Demo”).
- Seeds/E2E de CI permanecem só como tooling de teste, fora da UI.

## 2026-07-14 — ASO/documentos path opaco + pending render (`027`)

- Migration `202607140027_stabilization_document_opaque_path_pending_render.sql`: bucket `clinical-private`; create com path opaco + `pending`; `finalize_document_version_render`; imutabilidade com exceção estreita.
- App: remove `storagePath` do cliente; sobe stub PDF sem PHI via service role; só então finaliza `rendered`.
- Apply: **feita pelo dono** (2026-07-14).

## 2026-07-14 — preço server-side (`026`)

- Migration `202607140026_stabilization_server_side_price_snapshot.sql`: RPC resolve `unit_price_cents` da tabela aprovada; ignora amountCents/hash do cliente; valida encounter/contrato/tabela.
- App/UI: formulário usa `billableCode` (sem valor livre).
- pgTAP: `supabase/tests/server_side_price_snapshot.sql`.
- Apply: pendente do dono (após `025`).

## 2026-07-14 — portal IDOR hardening (`025`)

- Migration `202607140025_stabilization_portal_idor_hardening.sql`: `is_company_portal_member(tenant, company)` (+ membership ativa); upsert exige membership do tenant; release rule valida empresa∈tenant; FKs compostas portal→companies.
- UI: seletor de membros ativos do tenant (sem UUID livre).
- pgTAP negativo: `supabase/tests/portal_idor_hardening.sql`.
- Typegen offline regenerado. Apply no Supabase: pendente do dono.

## 2026-07-14 — fix types:supabase:check (CI)

- CI `quality` falhava em `pnpm types:supabase:check`: fingerprint das migrations ≠ `database.generated.sha256`.
- Regenerados tipos offline via `pnpm types:supabase:generate` (sem `SUPABASE_*`); `types:supabase:check` + `tsc --noEmit` OK.
- Substituir por typegen oficial quando houver projeto autorizado + token temporário.

## 2026-07-14 — fix build Vercel + lint CI

- Build Vercel (`next build` typecheck) falhou: `createGeneratedDocumentVersion` exigia `rectificationReason` porque `CreateDocumentVersionInput` usava `z.infer` (output com defaults aplicados).
- Corrigido: tipos de input de serviços/actions passaram de `z.infer` para `z.input` onde o schema tem `.default()` (documents, exams, finance, integrations, portal, scheduling, sst).
- CI `quality`/`pnpm lint`: `Date.now()` no render em `integrations-forms.tsx` → `useState(() => crypto.randomUUID())` (mesmo padrão de documentos).
- Dependency review: falha de configuração do repositório (Dependency graph) — ação humana em Settings → Security; aviso Node 20 é do action pinado, não do app.
- Gates locais: `tsc --noEmit` e `pnpm lint` OK. Commit/push pendente do usuário.

## 2026-07-12

- Confirmados raiz, remoto, branch, status, arquivos e histórico.
- Atualizada referência remota e aplicada atualização fast-forward sem sobrescrita.
- Criada branch de trabalho contínua.
- Lidos os documentos obrigatórios e movidos para nomes canônicos em `docs/product/`.
- Registrado conflito de continuidade no ADR-0006.
- Criada fundação documental da Fase 0; nenhum código funcional, dependência, banco ou serviço foi criado.
- Commit técnico da Fase 0: `5fdba2e`.
- Fase 1 iniciada com Next.js 16.2.10, React 19.2.7 e TypeScript 5.9.3.
- Criados bootstrap, CI, configuração estrita, clientes lazy, erros públicos, request ID, autorização tenant-aware, autenticação SSR e seleção explícita de tenant.
- Criados schema Drizzle, migration inicial, políticas RLS, contexto de autorização no banco e auditoria append-only.
- Criados fluxos reais de login, seleção de tenant, listagem/criação de unidades e bloqueio/reativação de memberships com confirmação e auditoria.
- Revisão React adicionou navegação funcional, loading, error state, mensagens acessíveis e tabelas operacionais.
- Revisão de segurança corrigiu escopo de unidade cruzado e removeu acesso autenticado à função genérica de auditoria.
- Nenhuma migration foi aplicada e nenhum serviço externo foi conectado.
- Commit `aef748a` foi publicado pelo usuário e abriu a PR #1; CI falhou em formatação do `tsconfig.json`.
- Corrigidos o CI e o redirecionamento sem sessão, que antes aguardava Supabase indisponível.
- Gates locais finais do checkpoint: formatação, lint, typecheck, 18 unitários, 2 E2E e build verdes.
- Adicionados callback seguro de autenticação, allowlist de redirecionamento, política de senha forte, recuperação de senha, troca de senha e logout local.
- Corrigido o runner E2E local no Windows para subir `next start`, executar Playwright e encerrar o servidor sem travar.
- Gates locais do checkpoint de autenticação: formatação, lint, typecheck, 22 unitários, 4 E2E e build verdes.
- Criado validador de Supabase real com Session Pooler, sem persistir segredos.
- Aplicada migration da Fase 1 em Supabase de teste autorizado e validados RLS, isolamento tenant A/B, bloqueio de membership e auditoria append-only.
- Corrigida ambiguidade SQL em `get_my_authorization_context` identificada pelo E2E autenticado.
- Adicionada tela de Segurança da conta com enrollment TOTP, desafio MFA e remoção de fator.
- Ações críticas de unidades e memberships passaram a exigir `aal2` além de permissão RBAC.
- Criado seed autenticado reproduzível para Supabase real, preservando auditoria append-only e limpando fatores MFA do usuário fictício.
- E2E autenticado real passou com login, seleção de tenant, bloqueio sem MFA, cadastro TOTP, sessão `aal2` e criação de unidade auditada.
- Iniciada a Fase 2 na branch `feat/fase-2-dominio-ocupacional`, com avanço autorizado pelo usuário apesar do typegen oficial ainda pendente por falta de Supabase CLI.
- Criada migration do domínio ocupacional com empresas, estabelecimentos, contatos, setores, funções, GHE, riscos, vínculos, PCMSO versionado, catálogo, protocolos, overrides e preços separados.
- Criado motor de cálculo de exames como função pura de domínio, sem decisão de aptidão.
- Criadas telas operacionais iniciais para empresa, trabalhador, catálogo de exames e PCMSO.
- Adicionado fluxo operacional único para estabelecimento, setor, função, GHE, risco, atribuição versionada e vínculo de trabalhador com histórico.
- Iniciada a Fase 3 na branch `feat/fase-3-encaminhamento-agenda`.
- Criada migration de encaminhamentos, importação, recursos de agenda, agendamentos, eventos e lista de espera com RLS.
- Criados motores de transição de encaminhamento, prévia de importação e conflito/reagendamento/cancelamento de agenda.
- Criada tela operacional inicial de recepção e agenda sem criação de atendimento clínico.
- Iniciada a Fase 4 na branch `feat/fase-4-checkin-fluxo-filas`.
- Criada migration de check-in transacional com encounters, snapshots imutáveis, steps, events, exam_orders, queues, idempotency_keys e outbox_events.
- Criados motor de estado de atendimento/etapas/fila e tela operacional de check-in.
- Iniciada a Fase 5 na branch `feat/fase-5-painel-chamadas`.
- Criada migration de painéis, sessões, heartbeats, eventos de chamada e entregas com payload público mínimo.
- Criados motor de payload seguro/heartbeat e tela operacional de painel de chamadas.
- Iniciada a Fase 6 na branch `feat/fase-6-triagem-consulta`.
- Criada migration clínica com credenciais profissionais, triagem versionada, alertas, pausas, consulta médica, adendos, regras e conclusões humanas bloqueáveis.
- Criados serviços e tela clínica para triagem, fechamento de consulta e preparação de conclusão sem gerar ASO definitivo.
- Iniciada a Fase 7A na branch `feat/fase-7a-acuidade`.
- Criada migration de acuidade visual com início de exame, resultado versionado, repetição sem apagamento e liberação da consulta quando concluído.
- Criados motor de validação de medidas, serviços e tela operacional para acuidade visual.
- Iniciada a Fase 7B na branch `feat/fase-7b-audiometria`.
- Criada migration de audiometria com calibrações, início de exame, limiares versionados, payload original futuro e bloqueio por calibração inválida.
- Criados motor de validação de repouso/limiares, serviços e tela operacional para audiometria.
- Iniciada a Fase 7C na branch `feat/fase-7c-espirometria`.
- Criada migration de espirometria com valores previstos configuráveis, calibração, manobras/tentativas, seleção aceita e versões auditáveis.
- Criado motor de cálculo técnico de percentuais sem interpretação clínica automática.
- Iniciada a Fase 7D na branch `feat/fase-7d-ecg-eeg-radiologia`.
- Criado modelo comum para ECG, EEG e radiologia com preparo, execução, arquivos privados, laudo, conclusão, validação externa e versões.
- Adicionadas validações para impedir arquivo clínico público e conclusão reportada sem laudo humano.
- Iniciada a Fase 7E na branch `feat/fase-7e-laboratorio`.
- Criada migration de laboratório com pedidos, itens, amostras, eventos, resultados, revisão/liberação, críticos e laboratório externo.
- Criadas validações de liberação crítica, referência configurável e payload opcional de código de barras sem conteúdo clínico.
- Iniciada a Fase 8 na branch `feat/fase-8-documentos`.
- Criada migration de documentos com templates versionados, documentos gerados, versões imutáveis, hash, storage privado, assinatura, entregas e logs de acesso.
- Criadas validações para ASO incompleto, caminho privado, nome físico sem conteúdo clínico e impressão A4 configurável.
- Iniciada a Fase 9 na branch `feat/fase-9-financeiro-portal`.
- Criada migration de contratos, tabelas de preço versionadas, snapshots de preço, orçamentos, faturamento, faturas, pagamentos, ajustes, glosas e portal empresarial.
- Criadas validações para impedir preço comercial alterar protocolo clínico, ignorar repetição técnica não cobrável e ocultar status clínico sensível no portal.
- Iniciada a Fase 10A na branch `feat/fase-10a-integracoes-webhooks`.
- Criada migration de infraestrutura de integrações com conexões, webhooks, jobs, entregas, dead-letter e logs redigidos.
- Criadas validações de payload redigido, assinatura HMAC de webhook, backoff exponencial e idempotência.
- Consultada documentação técnica oficial do eSocial em 2026-07-13: leiautes S-1.3 até NT 06/2026 rev. 09/04/2026, XSD produção 27/04/2026 e MOS S-1.3 consolidado até NO 11/2026.
- Iniciada a Fase 10B na branch `feat/fase-10b-esocial`.
- Criada migration de eSocial com versão de layout, eventos, validações, lotes, submissões, recibos e rejeições sem envio real para produção.
- Iniciada a Fase 10C na branch `feat/fase-10c-mensagens`.
- Criada migration de mensagens com templates versionados, consentimento/base, opt-out, fila durável e entregas.
- Criadas validações para bloquear conteúdo clínico sensível em mensagens abertas e exigir provedor oficial para WhatsApp.
- Iniciada a Fase 10D na branch `feat/fase-10d-equipamentos-conector`.
- Criada migration de equipamentos, calibrações, manutenções, conectores locais, tokens, eventos idempotentes e políticas de atualização.
- Criadas validações de calibração/manutenção, escopo mínimo, payload redigido e bloqueio a promessa de integração universal.
- Iniciada a Fase 11 na branch `chore/fase-11-producao-piloto`.
- Criado relatório operacional de produção/piloto com decisão NO-GO, runbooks, feature flags, rollout, rollback e matriz de validações humanas.
- Criado avaliador de prontidão para bloquear GO quando houver item crítico pendente ou tentativa de usar dados reais em piloto técnico.
- Iniciada auditoria geral pós-checkpoints das Fases 1–11.
- Executados scanners estáticos de segredo e mock/TODO, gates locais (`format:check`, `lint`, `typecheck`, unitários, build) e E2E público/local.
- Registrado relatório [GENERAL_AUDIT_20260713.md](GENERAL_AUDIT_20260713.md) com decisão PARCIAL/continuidade técnica e NO-GO para produção.
- Iniciada revisão visual/UX transversal na branch `codex/revisao-visual-ux`.
- Adicionados shell global responsivo, skip link, navegação por módulos e dashboard operacional revisado.
- Adicionados consoles server-side iniciais para espirometria, ECG/EEG/radiologia, laboratório, documentos, financeiro/portal e integrações, todos com autorização por permissão e filtro tenant confiável.
- Corrigida a leitura tipada de relações Supabase em laboratório e financeiro sem `any`.
- Gates locais da primeira unidade visual: formatação, lint, typecheck, 91 testes e build verdes; nenhum deploy ou dado real utilizado.
- Ampliado o seed autenticado com cenário operacional idempotente e estritamente fictício até agendamento, sem conclusão clínica, ASO emitido, destinatário real ou envio de integração.
- Ampliado o E2E autenticado para navegar domínio ocupacional, agenda, check-in, documentos, financeiro e integrações após MFA.
- Corrigida a relação do portal financeiro para consultar `user_profiles.display_name`, conforme o schema real.
- E2E público permaneceu verde; execução autenticada do novo cenário ficou pendente por ausência de credenciais temporárias do Supabase de teste na sessão.
- Completado o console operacional de espirometria com início de exame e registro versionado de manobra, preservando conclusão exclusivamente humana.
- Adicionada validação server-side do tipo do catálogo antes de iniciar espirometria, impedindo uso de ordem de outra modalidade por envio manual de ID.
- Organizadas as branches remotas após comparação de commits: 16 branches históricas `feat/fase-*`, todas integralmente contidas em `codex/revisao-visual-ux` e sem PR aberta, foram removidas sem excluir commits úteis.

## 2026-07-13 — Fase A do Plano Mestre V2

- Consolidada com fast-forward local a branch `codex/desenvolvimento-completo-unimetra` até `1ce8c4e`, preservando a branch visual e todo o histórico.
- Reconciliados README, AGENTS, status, roadmap V2 e auditorias com o estado real.
- Confirmado bypass estrutural: permissão limitada à unidade era agregada como tenant-wide; policies permitiam DML direto sem AAL2/auditoria.
- Adicionada migration fail-closed: DML direto revogado, policies de escrita removidas e RPCs mutacionais não reauditedas congeladas.
- Reescritas RPCs de unidade/membership com AAL2 no banco, auditoria antes/depois e proteção do último administrador.
- Criadas funções de autorização por unidade, empresa, profissional, atendimento e documento; contexto da aplicação separa permissões tenant/unidade e exige versão 2.
- Supabase CLI 2.109.1 fixada; geração atômica e verificação de drift por fingerprint adicionadas. Typegen real segue bloqueado por falta de projeto autorizado com schema completo.
- CI pinado por SHA e ampliado com CodeQL, dependency review, Dependabot, secret scan, audit e verificação de tipos Supabase.
- Corrigidas duas vulnerabilidades moderadas transitivas com overrides de PostCSS/esbuild; auditoria passou sem achados.
- Corrigidas leituras de relações embutidas do Supabase (`exam_catalog`, `companies`, `external_laboratories`) que quebravam espirometria, financeiro e laboratório em runtime.
- Adicionado fluxo de uso real: cadastro em `/sign-up`, criação de organização em `/select-tenant` e provisionamento via `provision_tenant_for_user` com service role no servidor.

## 2026-07-13 — P0.5 proteção administrativa de papéis

- Migration `202607140010_p0_5_admin_role_protection.sql`: RPCs `assign_membership_role` e `revoke_membership_role` com AAL2, `roles.manage`, anti-autoelevação, proteção do último `tenant_admin`, auditoria transacional e grant explícito.
- App: schemas/serviço/actions + UI em `/app/access` para conceder/remover papéis.
- Bloqueio/inativação de vínculo passa a tentar `auth.admin.signOut(userId, "global")` via service role (best-effort).
- Teste pgTAP negativo em `supabase/tests/p0_5_admin_role_protection.sql`; schemas unitários ampliados; fingerprint de migrations atualizado.

## 2026-07-13 — P0.6 auditoria de leitura sensível (checkpoint)

- Migration `202607140011_p0_6_sensitive_read_audit.sql`: RPCs `log_sensitive_read` e `log_document_access` (metadados only).
- Helper `src/features/audit/sensitive-read.ts`; wired em consulta (`chart.viewed`) e lista de documentos (`document.list_viewed`).
- Apply no Supabase autorizado ainda pendente.

## 2026-07-13 — P0.5/P0.6 apply + P0.4 onda 4

- Dono aplicou 202607140010 e 202607140011 no Supabase autorizado (SQL Editor, sem erro).
- Criada migration 202607140012_p0_4_composite_tenant_fks_pcmso_exams_docs.sql (PCMSO/protocolos/riscos, exames 7a–d, documentos, painel).
