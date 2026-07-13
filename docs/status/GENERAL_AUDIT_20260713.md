# Auditoria geral pós-checkpoints — 2026-07-13

## Resultado executivo

O projeto avançou tecnicamente pelas fases 0 a 11, mas ainda não pode ser tratado como MVP operacional aceito.

O estado atual é adequado para continuidade técnica, revisão visual/UX e fechamento de pendências. Continua **NO-GO para produção**.

## Verificações executadas nesta revisão

| Verificação                 | Resultado             | Observação                                                                           |
| --------------------------- | --------------------- | ------------------------------------------------------------------------------------ |
| `git status`                | PASSOU                | branch limpa em `chore/fase-11-producao-piloto`                                      |
| scanner estático de segredo | PASSOU                | nenhum arquivo contendo padrões sensíveis encontrado                                 |
| scanner de TODO/mock        | PASSOU COM OBSERVAÇÃO | sem mock crítico em produção; apenas placeholders, stubs documentados e fallback E2E |
| `pnpm format:check`         | PASSOU                | Prettier ok                                                                          |
| `pnpm lint`                 | PASSOU                | zero warnings                                                                        |
| `pnpm typecheck`            | PASSOU                | TypeScript strict ok                                                                 |
| `pnpm test`                 | PASSOU                | 27 arquivos e 91 testes unitários verdes                                             |
| `pnpm build`                | PASSOU                | Next.js compilou e gerou 20 rotas                                                    |
| E2E público/local           | PASSOU                | 4 testes verdes                                                                      |

## Verificações ainda não executadas nesta rodada

- E2E autenticado real, porque depende de seed/credenciais de Supabase de teste em variáveis de ambiente.
- Validação SQL completa das migrations de todas as fases em banco descartável.
- Typegen oficial do Supabase.
- Teste E2E completo do fluxo ponta a ponta: empresa → PCMSO → encaminhamento → agenda → check-in → chamada → triagem → exames → consulta → documento → faturamento.
- Testes de carga, concorrência e restauração.
- Pentest/revisão de segurança externa.
- Revisão formal de acessibilidade com ferramenta dedicada.

## Cobertura real por fase

| Fase                                                | Estado real após revisão                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0 — Fundação documental                             | tecnicamente concluída; ADRs seguem como PROPOSTA até aceite humano/técnico                                 |
| 1 — Plataforma e segurança                          | base funcional validada; typegen oficial segue pendente                                                     |
| 2 — Domínio ocupacional                             | checkpoint técnico publicado; precisa revisão final e E2E integrado                                         |
| 3 — Encaminhamentos e agenda                        | checkpoint técnico publicado; precisa E2E integrado                                                         |
| 4 — Check-in, etapas e filas                        | checkpoint técnico publicado; precisa concorrência/E2E integrado                                            |
| 5 — Painel de chamadas                              | checkpoint técnico publicado; precisa validação Realtime/dispositivo em ambiente real                       |
| 6 — Triagem e consulta                              | checkpoint técnico publicado; depende de validação clínica                                                  |
| 7A/7B — Acuidade e audiometria                      | possuem tela operacional inicial e testes unitários                                                         |
| 7C/7D/7E — Espirometria, diagnósticos e laboratório | domínio, migration e testes existem; faltam telas operacionais completas                                    |
| 8 — Documentos                                      | domínio, migration e testes existem; faltam telas/fluxo completo de geração, assinatura, acesso e impressão |
| 9 — Financeiro e portal                             | domínio, migration e testes existem; faltam telas completas do financeiro e portal empresarial              |
| 10 — Integrações                                    | domínio, migration e testes existem; faltam consoles operacionais/admin e validações externas               |
| 11 — Produção/piloto                                | relatório NO-GO e runbooks publicados; produção não autorizada                                              |

## Achados principais

### A1 — Checkpoints não equivalem a produto operacional completo

As fases mais recentes priorizaram schema, regras de domínio, validações e testes unitários. Isso é útil para fundação técnica, mas ainda não entrega todos os fluxos navegáveis na interface.

Impacto: usuário consegue ver parte do sistema, mas não todo o ciclo operacional previsto no guia.

Correção recomendada: abrir uma frente transversal de UI/UX e fluxo operacional para completar telas faltantes antes de chamar de MVP.

### A2 — Falta E2E completo do fluxo ocupacional

O projeto possui E2E público e autenticado de segurança, mas ainda não possui E2E cobrindo o fluxo central inteiro.

Impacto: não há evidência automatizada de que os módulos funcionem juntos de ponta a ponta.

Correção recomendada: criar seed fictício completo e E2E integrado em ambiente Supabase de teste.

### A3 — Supabase CLI/typegen segue pendente

O typegen oficial não foi gerado porque a CLI não estava disponível no ambiente de execução.

Impacto: parte da segurança de tipos entre banco e aplicação ainda depende de contratos manuais.

Correção recomendada: instalar/disponibilizar Supabase CLI ou gerar tipos em ambiente autorizado e versionar apenas o arquivo de tipos, sem segredos.

### A4 — Validações humanas continuam bloqueadoras para GO

Clínica, jurídico/LGPD, segurança, financeiro, eSocial e usuários-chave ainda precisam validar o sistema.

Impacto: produção e piloto com dados reais continuam proibidos.

Correção recomendada: manter decisão NO-GO até aceite formal.

### A5 — Status legado estava desatualizado

Alguns arquivos de compatibilidade ainda descreviam o projeto como se não houvesse código funcional.

Impacto: leitura confusa do estado real.

Correção: atualizar arquivos de status para refletir a auditoria geral.

## Próxima unidade recomendada

Executar uma frente transversal chamada **Revisão visual/UX e fechamento de telas operacionais**.

Escopo sugerido:

1. Padronizar layout, navegação, densidade visual, tabelas, empty/error/loading states e mensagens.
2. Completar telas operacionais faltantes para espirometria, diagnósticos, laboratório, documentos, financeiro/portal e integrações.
3. Criar seed fictício de demonstração suficiente para navegar o sistema.
4. Criar E2E integrado depois que as telas principais existirem.

## Decisão da auditoria

Estado: **PARCIAL / CONTINUIDADE TÉCNICA AUTORIZADA**.

Não há bloqueio de compilação local. Há bloqueio de produto/produção até fechamento de telas, E2E completo, validações humanas e auditoria final.
