# Fase 11 — Preparação de Produção e Piloto

Atualizado em: 2026-07-13.

## Decisão atual: NO-GO

O sistema não está aprovado para produção. O avanço técnico foi acelerado por solicitação do usuário, mas produção exige validações humanas, testes completos, revisão de segurança e autorização expressa.

## Itens críticos obrigatórios antes de produção

| Área                      | Situação | Observação                                                                                          |
| ------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| Revisão médica            | Pendente | Responsável médico deve validar triagem, consulta, conclusões, ASO e exames.                        |
| Executores técnicos       | Pendente | Profissionais devem validar acuidade, audiometria, espirometria, laboratório e exames diagnósticos. |
| Jurídico/LGPD             | Pendente | Validar bases legais, retenção, portal empresarial, documentos e mensagens.                         |
| Segurança                 | Pendente | Pentest, revisão RLS, segredos, storage privado, logs e rate limits.                                |
| Contabilidade/faturamento | Pendente | Validar contratos, preços, faturamento, glosas, pagamentos e relatórios.                            |
| eSocial                   | Pendente | Responsável eSocial deve validar layout vigente, payloads e ambiente antes de qualquer envio real.  |
| Fabricantes               | Pendente | Integrações de equipamentos dependem de SDK/documentação oficial.                                   |
| Usuários-chave            | Pendente | Recepção, triagem, consultório, exames, financeiro e empresa devem validar fluxo piloto.            |

## Checklist técnico antes de piloto

- Executar lint, typecheck, testes unitários, integração, E2E completo e build.
- Testar autorização e RLS com tenant A/B, usuário empresarial e perfis sem escopo clínico.
- Testar concorrência de check-in, filas, chamadas, agenda, faturamento e emissão documental.
- Rodar carga controlada com metas documentadas.
- Validar logs redigidos e ausência de dados clínicos sensíveis em mensagens, webhooks e observabilidade.
- Validar alertas para erro de job, dead-letter, falha de storage, falha de banco e falha de autenticação.
- Executar backup lógico externo e teste de restauração.
- Validar backup de Storage privado e restauração de documentos.
- Definir RPO/RTO formal.
- Validar rollback de migration e rollback de release.

## Runbooks mínimos

### Queda de internet na clínica

1. Pausar novos check-ins dependentes de integrações externas.
2. Manter atendimento local apenas quando permitido por procedimento interno.
3. Registrar pendências para reconciliação.
4. Não emitir documentos finais se dados obrigatórios não estiverem sincronizados.
5. Reconciliar agenda, filas, exames e documentos após retorno.

### Incidente de segurança

1. Isolar credenciais e sessões afetadas.
2. Preservar logs e trilha de auditoria.
3. Revogar tokens/conectores suspeitos.
4. Acionar responsável de segurança e LGPD.
5. Avaliar comunicação formal aos titulares/controladores.
6. Só reativar após causa raiz e evidência de correção.

### Falha de geração documental

1. Não sobrescrever documento emitido.
2. Registrar falha e hash/snapshot quando existir.
3. Retentar via workflow idempotente.
4. Se houver correção, gerar nova versão/retificação.
5. Auditar download ou assinatura posterior.

### Falha eSocial

1. Não apagar rejeições.
2. Registrar payload redigido, recibo ou erro.
3. Corrigir em novo evento versionado.
4. Reenviar de forma idempotente apenas em ambiente autorizado.
5. Bloquear produção se layout/credencial/certificado não estiver validado.

## Feature flags sugeridas

- `enable_company_portal`
- `enable_document_generation`
- `enable_document_signature`
- `enable_esocial_restricted`
- `enable_message_delivery`
- `enable_local_connector`
- `enable_financial_reports`

Todas devem iniciar desligadas em produção até validação humana.

## Rollout controlado

1. Piloto interno com dados fictícios.
2. Piloto com uma unidade e volume controlado, após autorização.
3. Habilitar módulos por flag e perfil.
4. Monitorar filas, erros, auditoria e suporte.
5. Revisar achados diariamente.
6. Expandir somente sem bloqueadores críticos.

## Rollback

- Desligar feature flags.
- Pausar jobs externos.
- Revogar conectores e webhooks.
- Reverter release de aplicação.
- Não reverter migration destrutivamente sem plano; preferir migration corretiva.
- Preservar documentos, auditoria, rejeições e histórico clínico.

## Plano de comunicação

- Canal interno para incidentes críticos.
- Responsável de decisão clínica.
- Responsável técnico.
- Responsável LGPD.
- Responsável financeiro.
- Responsável eSocial.
- Comunicação separada para empresas, sem conteúdo clínico sensível.

## Suporte

- Classificar chamados por impacto: bloqueador, alto, médio, baixo.
- Nunca solicitar senha.
- Nunca anexar prontuário em canal aberto.
- Usar identificadores técnicos e dados redigidos.
- Toda ação administrativa sensível exige MFA.

## Conclusão GO/NO-GO

NO-GO para produção.

Justificativa: faltam validações humanas formais, testes completos, pentest, carga, restauração, revisão legal/LGPD, validação contábil, validação eSocial e piloto controlado. O estado atual é adequado para continuidade técnica e revisão, não para operação real.
