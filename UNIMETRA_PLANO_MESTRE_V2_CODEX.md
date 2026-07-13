# UNIMETRA — PLANO MESTRE V2 PARA O CODEX

**Versão:** 2.0  
**Data:** 13/07/2026  
**Repositório:** `mentorupbrasil/gestorpro`  
**Branch de desenvolvimento:** `codex/desenvolvimento-completo-unimetra`

## Objetivo

Reauditar a fundação já criada, corrigir riscos antes dos módulos clínicos e conduzir a construção de uma plataforma de saúde ocupacional completa, segura, rastreável e superior operacionalmente.

Este plano não autoriza: merge na `main`, produção, uso de dados reais, credenciais inventadas, migrations destrutivas, decisões clínicas automáticas ou conclusões jurídicas/regulatórias feitas pela IA.

---

# 1. DIAGNÓSTICO ATUAL

A branch de desenvolvimento já possui:

- Next.js, React, TypeScript estrito e pnpm;
- Supabase Auth/SSR;
- login, logout, recuperação e troca de senha;
- tenant, memberships, papéis e permissões;
- RLS;
- auditoria append-only;
- MFA TOTP e AAL2 na camada de aplicação;
- CI, testes unitários, E2E público e E2E autenticado;
- validação real de tenant A/B;
- preview na Vercel;
- documentação de arquitetura.

Isso é uma boa fundação, mas ainda não é um sistema operacional de clínica. Os domínios de empresa, trabalhador, PCMSO, protocolos, agenda, check-in, filas, exames, consulta, ASO, faturamento e portais ainda não estão implementados de ponta a ponta.

Há divergência documental: `README.md` e `MASTER_STATUS.md` estão atrasados em relação a `CURRENT_PHASE.md`, aos commits e aos testes. O roadmap existente também é superficial.

---

# 2. RISCOS A CORRIGIR ANTES DA FASE 2

## P0.1 — Repositório público

O repositório deve ser tornado privado por ação humana. Revisar colaboradores, GitHub Apps, deploy keys, webhooks, tokens, Vercel, Supabase e histórico de segredos. Enquanto permanecer público, isso é bloqueio de produção.

## P0.2 — Possível bypass de AAL2 e auditoria

A aplicação exige AAL2 para ações administrativas, mas algumas policies RLS permitem `INSERT`/`UPDATE` direto em tabelas. Um cliente Supabase pode tentar contornar o serviço da aplicação.

Corrigir assim:

- negar DML direto para operações críticas;
- executar mutações sensíveis por RPC transacional;
- validar usuário, tenant, recurso, permissão e AAL2 no banco;
- gerar auditoria na mesma transação;
- usar idempotência quando aplicável;
- testar o bypass por chamada direta.

Aplicar a unidades, memberships, papéis, permissões, ativação de PCMSO, overrides, conclusão clínica, assinatura, retificação, faturamento e integrações.

## P0.3 — Escopo por unidade incompleto

`membership_roles` possui `clinic_unit_id`, mas a verificação geral de permissão não incorpora esse escopo em todas as operações.

Criar autorização por recurso:

```text
has_tenant_permission
has_unit_permission
has_company_permission
has_professional_permission
has_encounter_permission
has_document_permission
```

Testar unidade A/B, empresa A/B, sala, profissional, documento e atendimento.

## P0.4 — Integridade referencial multi-tenant

RLS não substitui foreign keys que garantam que entidades relacionadas pertencem ao mesmo tenant.

Usar, quando aplicável:

```sql
unique (tenant_id, id)
foreign key (tenant_id, company_id)
  references companies (tenant_id, id)
```

Aplicar aos principais relacionamentos de empresa, trabalhador, vínculo, PCMSO, protocolo, agenda, atendimento, exame, documento e financeiro.

## P0.5 — Proteção administrativa

Implementar:

- impedir remoção/bloqueio do último administrador;
- impedir autoelevação;
- MFA para concessão de privilégio;
- separação entre administrador técnico e acesso clínico;
- acesso emergencial com justificativa, prazo, alerta e auditoria;
- revogação de sessão ao bloquear usuário.

## P0.6 — Auditoria de leitura sensível

Auditar também:

- prontuário visualizado;
- resultado visualizado;
- documento baixado;
- URL assinada;
- impressão/reimpressão;
- exportação;
- pesquisa sensível;
- acesso emergencial.

Não registrar conteúdo clínico bruto.

## P0.7 — Typegen e supply chain

- gerar tipos oficiais do Supabase;
- falhar CI quando schema e tipos divergirem;
- secret scanning;
- CodeQL/SAST;
- dependency review;
- SBOM;
- política de licenças;
- atualização automatizada;
- pinning de GitHub Actions;
- branch protection;
- ambientes protegidos;
- approval obrigatório para produção.

## P0.8 — PR e documentação

- manter o PR principal como draft;
- não fazer merge enquanto a auditoria não passar;
- atualizar README, status, roadmap e ADRs;
- não criar branches de fases futuras antecipadamente;
- manter apenas branches com trabalho real.

---

# 3. BENCHMARK E DIFERENCIAIS

Não afirmar que concorrentes “não têm” algo apenas porque não aparece em seus sites. Classificar cada comparação como:

- evidenciado publicamente;
- não evidenciado publicamente;
- hipótese a validar em demonstração;
- diferencial proposto.

Sistemas do mercado divulgam agenda, PCMSO/PGR, ASO, prontuário, exames, eSocial, portal, financeiro, indicadores, rede credenciada, convocação, absenteísmo, CAT, vacinação, PPP/LTCAT, EPI, CIPA, treinamentos e integrações.

A Unimetra deve ser melhor nos pontos abaixo.

## 3.1 Roteiro individual explicável

Cada exame deve informar:

- versão do PCMSO;
- regra;
- função, setor, GHE e risco;
- vigência;
- exceção;
- override;
- justificativa;
- responsável.

## 3.2 Máquina de estados real

Cada atendimento deve possuir etapas, dependências, paralelismo, repetição, bloqueio, redirecionamento, SLA, eventos e recuperação de falhas.

## 3.3 Cockpit de exceções

Centralizar:

- protocolo ausente;
- PCMSO vencido;
- vínculo inconsistente;
- duplicidade;
- resultado crítico;
- equipamento vencido;
- exame inconclusivo;
- etapa travada;
- ASO pendente;
- documento com erro;
- painel offline;
- amostra atrasada;
- integração rejeitada;
- faturamento divergente.

Cada ocorrência deve possuir prioridade, responsável, SLA, evidências, ações e histórico.

## 3.4 Segurança verificável

Demonstrar por testes:

- isolamento por tenant;
- escopo por unidade/empresa/profissional;
- MFA;
- auditoria de leitura;
- storage privado;
- retenção;
- legal hold;
- resposta a incidente;
- testes periódicos de autorização.

## 3.5 Contingência operacional

- agenda segura do dia;
- formulário numerado;
- QR para reconciliação;
- sincronização idempotente;
- prevenção de duplicidade;
- procedimento de queda;
- conector local limitado no futuro.

## 3.6 Experiência operacional

- busca universal;
- atalhos;
- comando rápido;
- tabelas densas;
- painel lateral;
- timeline;
- stepper compacto;
- filtros persistentes;
- tablet;
- WCAG 2.2 AA;
- sem excesso de cards.

## 3.7 IA assistiva segura

Permitido: detectar incompletude, duplicidade, gargalos, erros de importação e resumir pendências administrativas.

Proibido: diagnosticar, decidir aptidão, interpretar exame como decisão final, inventar PCMSO ou alterar prontuário sem revisão.

---

# 4. CAMADAS DO PRODUTO

## Camada 1 — Clínica Core

- tenants, unidades, salas, estações e dispositivos;
- usuários, profissionais, conselhos e permissões;
- empresas, estabelecimentos, setores, funções e GHE;
- trabalhadores e vínculos;
- riscos;
- PCMSO versionado;
- protocolos;
- catálogo de exames;
- preços;
- encaminhamento e importação;
- agenda;
- check-in;
- snapshots;
- etapas e filas;
- painel de chamada;
- triagem;
- consulta;
- exames essenciais;
- conclusão humana;
- ASO e documentos;
- assinatura, impressão e entrega;
- faturamento básico;
- portal empresarial básico;
- auditoria, observabilidade, backup e contingência.

## Camada 2 — Competitividade

- convocação e campanhas;
- kiosk/QR;
- PWA do paciente;
- rede de prestadores;
- exames externos;
- estoque, lotes e reagentes;
- cadeia de custódia;
- SLA e escalonamento;
- workflow configurável;
- dashboards;
- assinatura avançada;
- verificação controlada de documento;
- NFS-e/cobrança;
- integrações RH/ERP;
- migração assistida;
- suporte dentro do sistema.

## Camada 3 — SST ampliada

- absenteísmo;
- atestados e afastamentos;
- CAT;
- FAP/NTEP;
- vacinação;
- PcD;
- PPP;
- LTCAT;
- PGR;
- PCA/PPR;
- EPI;
- CIPA;
- treinamentos;
- incidentes;
- ergonomia;
- inspeções;
- planos de ação.

A Camada 3 não pode atrasar o Clínica Core.

---

# 5. ROADMAP V2

## Fase A — Reauditoria e correção da fundação

Entregáveis:

- inventário real do repositório;
- sincronização de README/status/roadmap;
- typegen Supabase;
- auditoria de grants, policies, RPCs e `security definer`;
- bloqueio de DML que contorne AAL2/auditoria;
- autorização orientada a recurso;
- constraints multi-tenant;
- proteção do último administrador;
- auditoria de leitura;
- scanners de segurança;
- threat model e ADRs atualizados;
- testes de bypass, RLS, IDOR e escopo.

Gate:

- CI verde;
- nenhum bypass crítico;
- AAL2 validado também no banco;
- escopo por unidade comprovado;
- tenant cruzado impedido por autorização, RLS e integridade;
- documentação consistente;
- PR em draft;
- nenhum merge/produção.

## Fase B — Plataforma e governança

- tenant completo;
- unidades;
- salas;
- estações;
- profissionais;
- registros profissionais;
- dispositivos;
- configurações;
- feature flags;
- sessões;
- break-glass;
- outbox;
- idempotência;
- jobs;
- rate limiting;
- observabilidade;
- backup/restauração;
- painel de saúde do sistema.

Gate: restauração testada, auditoria completa, suporte restrito, ambientes separados e SLOs definidos.

## Fase C — Empresas, trabalhadores e dados mestres

- empresas;
- estabelecimentos/CNO/CAEPF;
- contratos e contatos;
- setores;
- funções;
- GHE;
- riscos;
- trabalhadores;
- vínculos versionados;
- salas/equipamentos/calibração;
- catálogos;
- deduplicação;
- merge rastreável;
- importação com prévia;
- qualidade de dados.

Gate: importação idempotente, merge sem perda, histórico preservado e testes de volume.

## Fase D — PCMSO e motor de protocolos

- workflow de PCMSO;
- versões, vigências e aprovação;
- GHE/riscos versionados;
- regras, periodicidade e exceções;
- simulação;
- explicação;
- conflitos;
- diff entre versões;
- ativação;
- rollback controlado;
- override auditado.

Gate: ausência de protocolo bloqueia; histórico usado é imutável; testes extensos de vigência e conflito.

## Fase E — Encaminhamento, convocação e agenda

- encaminhamento;
- portal solicitante;
- importação;
- agenda por unidade/sala/profissional/exame/equipamento;
- capacidade;
- bloqueios;
- lista de espera;
- confirmação;
- no-show;
- preparo;
- reagendamento;
- convocação;
- campanhas;
- SLA.

Gate: sem choque indevido, timezone testado, acesso empresarial limitado e importação idempotente.

## Fase F — Check-in, etapas, filas e painel

- check-in transacional;
- idempotência;
- snapshot;
- pedidos;
- etapas/dependências;
- filas;
- chamada/rechamada;
- comparecimento;
- redirecionamento;
- prioridade;
- TV/voz;
- heartbeat;
- reconciliação;
- privacidade;
- kiosk/QR futuro.

Gate: duplo clique não duplica; duas salas não chamam o mesmo paciente; falha gera rollback; reconexão recupera estado.

## Fase G — Triagem, prontuário e consulta

- formulários versionados;
- sinais vitais;
- alergias;
- alertas;
- intercorrências;
- anamnese;
- exame físico;
- histórico;
- consulta;
- adendo;
- reabertura;
- conclusão humana;
- restrições;
- incidentes assistenciais.

Gate: dois identificadores; recepção sem prontuário completo; empresa sem anamnese; conclusão não automatizada.

## Fase H — Exames em fatias verticais

Cada exame deve completar:

```text
pedido → fila → execução → resultado → versão → alerta
→ revisão → documento → consulta → faturamento → auditoria → testes
```

Subfases:

1. acuidade visual;
2. audiometria;
3. espirometria;
4. ECG/EEG/radiologia;
5. laboratório e cadeia de custódia;
6. psicossocial/questionários;
7. vacinação.

Gate por subfase: profissional habilitado, calibração, completude, correção versionada, resultado crítico e E2E.

## Fase I — ASO, documentos e assinaturas

- templates versionados;
- preview fictício;
- PDF determinístico;
- hash;
- storage privado;
- assinatura;
- retificação;
- impressão/reimpressão;
- entrega;
- expiração;
- revogação;
- QR de verificação mínima;
- abstração para ICP-Brasil/carimbo do tempo.

Gate: ASO incompleto impossível; assinatura vinculada ao hash; original preservado; download autorizado e auditado.

## Fase J — Financeiro

- contratos;
- preços e vigência;
- pacotes;
- orçamento;
- snapshot de preço;
- itens realizados;
- repetição/cortesia;
- glosa;
- faturamento;
- fatura;
- pagamento;
- conciliação;
- NFS-e/cobrança futura.

Gate: preço histórico imutável; comercial não altera protocolo clínico; acesso segregado.

## Fase K — Portais e prestadores

- portal da empresa;
- PWA do paciente;
- documentos permitidos;
- rede de prestadores;
- cobertura;
- SLA;
- envio/retorno;
- qualidade;
- faturamento.

Gate: testes de IDOR; nenhum prontuário indevido; matriz de documentos respeitada.

## Fase L — eSocial, integrações e conector

- layouts versionados;
- eventos aplicáveis;
- validação/transmissão;
- recibo/rejeição/retificação;
- webhooks;
- laboratório;
- equipamentos;
- RH/ERP;
- mensagens;
- assinatura;
- conector local;
- spool e pasta monitorada.

Gate: documentação oficial vigente, credenciais em cofre, sandbox, retry/dead-letter e testes de contrato.

## Fase M — SST ampliada

Implementar como módulos independentes: absenteísmo, CAT, FAP/NTEP, PPP, LTCAT, PGR, PCA/PPR, EPI, CIPA, treinamentos, ergonomia, incidentes e inspeções.

## Fase N — Produção e piloto

Somente após:

- validação médica;
- jurídica/LGPD;
- pentest;
- carga;
- autorização;
- backup/restauração;
- contingência;
- treinamento;
- homologação;
- piloto controlado;
- canal de incidente;
- plano de rollback.

---

# 6. GATES GLOBAIS

Toda feature crítica precisa de:

- regra documentada;
- autorização server-side;
- RLS;
- integridade multi-tenant;
- validação;
- transação;
- idempotência;
- auditoria;
- tratamento de erro;
- observabilidade;
- loading/empty/error;
- acessibilidade;
- unitário;
- integração;
- teste de RLS;
- teste negativo;
- E2E;
- migration revisada;
- rollback;
- documentação.

Cenários obrigatórios:

- tenant A não acessa B;
- unidade A não acessa B;
- empresa não acessa prontuário;
- recepção não conclui ASO;
- técnico não edita exame incompatível;
- duas salas não chamam o mesmo paciente;
- duplo clique não duplica check-in;
- protocolo ausente bloqueia;
- PCMSO vencido bloqueia;
- equipamento vencido bloqueia ou exige exceção formal;
- resultado crítico exige reconhecimento;
- documento não é sobrescrito;
- URL expirada falha;
- workflow repetido não duplica;
- último administrador não é removido;
- DML direto não contorna AAL2/auditoria.

---

# 7. ARQUIVOS DE CONTROLE A CRIAR

```text
docs/audit/CURRENT_REPOSITORY_AUDIT.md
docs/audit/AUTHORIZATION_AUDIT.md
docs/audit/RLS_AUDIT.md
docs/audit/DATA_INTEGRITY_AUDIT.md
docs/audit/COMPETITOR_BENCHMARK.md
docs/audit/PRODUCTION_READINESS.md

docs/product/FEATURE_MATRIX.md
docs/product/REQUIREMENTS_TRACEABILITY.md
docs/product/CLINIC_CORE_SCOPE.md
docs/product/COMPETITIVE_SCOPE.md
docs/product/EXPANDED_SST_SCOPE.md

docs/planning/ROADMAP_V2.md
docs/planning/PHASE_GATES.md
docs/planning/DEPENDENCIES_V2.md
docs/planning/RELEASE_PLAN.md

docs/security/BREAK_GLASS.md
docs/security/SENSITIVE_READ_AUDIT.md
docs/security/SESSION_AND_DEVICE_SECURITY.md

docs/testing/SECURITY_REGRESSION_MATRIX.md
docs/testing/MULTITENANCY_MATRIX.md
docs/testing/CLINICAL_SAFETY_MATRIX.md
```

---

# 8. PROMPT ÚNICO PARA COLAR NO CODEX

```text
Você é o agente técnico responsável pela reauditoria e evolução contínua da plataforma Unimetra.

Leia integralmente, antes de editar:

1. `docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md`
2. `docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md`
3. `docs/product/UNIMETRA_PLANO_MESTRE_V2_CODEX.md`
4. `AGENTS.md`
5. todos os arquivos de `docs/status/`
6. todos os ADRs
7. todas as migrations, policies RLS, grants, RPCs, serviços de autorização e testes.

O plano V2 substitui o roadmap superficial anterior quando houver divergência, sem substituir a especificação-mestre nas regras funcionais, clínicas e de segurança.

COMECE PELA FASE A.

Não inicie empresas, PCMSO, agenda ou módulos clínicos antes de corrigir os riscos críticos da fundação.

Execute:

1. reconstrua o estado real do Git, branch, PR, commits, CI, deploys, código, banco e testes;
2. compare o código com README, status e roadmap;
3. atualize a documentação;
4. gere tipos oficiais do Supabase;
5. audite policies, grants, funções `security definer`, RPCs e serviços;
6. tente contornar AAL2, auditoria e autorização por DML direto;
7. corrija todos os bypasses;
8. exija usuário, tenant, recurso, escopo, permissão e AAL2 no banco para operações críticas;
9. implemente autorização por tenant, unidade, empresa, profissional, atendimento e documento;
10. garanta que papel limitado à unidade não se torne tenant-wide;
11. adicione constraints multi-tenant compostas;
12. proteja o último administrador e impeça autoelevação;
13. implemente/audite leitura sensível e downloads;
14. adicione testes negativos de bypass, RLS, IDOR, escopo e tenant cruzado;
15. execute scanners de segredo, dependência e segurança;
16. atualize threat model, ADRs, matrizes e status;
17. mantenha o PR principal como draft;
18. registre como ação humana tornar o repositório privado;
19. não faça merge em `main`;
20. não faça deploy em produção.

Crie os documentos de auditoria, matriz de funcionalidades, rastreabilidade, roadmap V2 e gates descritos no plano.

Gate da Fase A:

- documentação sincronizada;
- typegen concluído;
- lint, format, typecheck, unitários, integração, RLS, E2E e build verdes;
- CI verde;
- nenhum bypass de AAL2/auditoria;
- escopo por unidade validado;
- tenant cruzado impedido por autorização, RLS e integridade;
- último administrador protegido;
- nenhum segredo;
- PR em draft;
- nenhum merge/produção.

Depois do aceite técnico da Fase A, prossiga automaticamente pelas fases B a N deste plano, respeitando cada gate.

Pare e registre bloqueio quando houver decisão clínica, jurídica/LGPD, credencial, custo, ação de produção, migration destrutiva, dado real, contrato externo ou regra regulatória não confirmada. Continue tarefas independentes sem inventar solução.

Regras permanentes:

- nunca usar dados reais;
- nunca versionar segredo;
- nunca automatizar diagnóstico ou aptidão;
- nunca desabilitar RLS;
- nunca confiar em `tenant_id` do cliente;
- nunca usar bucket clínico público;
- nunca sobrescrever histórico/documento;
- nunca esconder falha com mock;
- nunca declarar feature pronta apenas pela interface;
- nunca criar branches futuras antecipadamente;
- nunca usar force push;
- nunca fazer merge em `main`;
- nunca fazer produção.

Ao final de cada fase:

1. faça auditoria independente;
2. execute todos os gates;
3. atualize status;
4. registre comandos, arquivos, testes e evidências;
5. faça commit pequeno;
6. faça push sem force, quando permitido;
7. prossiga somente com gate atendido.

Comece agora pela verificação do repositório e Fase A.
```

---

# 9. DEFINIÇÃO REALISTA DE PRONTO

O sistema não está pronto apenas porque compila, possui telas, tem CI verde ou gera PDF.

Só estará apto a piloto depois de:

- fluxo real homologado;
- usuários treinados;
- regras clínicas aprovadas;
- permissões revisadas;
- documentos aprovados;
- segurança testada;
- backup restaurado;
- contingência ensaiada;
- carga testada;
- integrações homologadas;
- piloto acompanhado.

Nenhum agente garante “perfeição”. A qualidade vem de arquitetura, testes, validação clínica, segurança, operação e melhoria contínua.
