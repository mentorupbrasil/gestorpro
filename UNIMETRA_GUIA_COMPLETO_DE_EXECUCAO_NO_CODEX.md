# UNIMETRA — GUIA COMPLETO DE EXECUÇÃO NO CODEX

**Versão:** 1.0  
**Data-base:** 12/07/2026  
**Repositório informado:** `https://github.com/mentorupbrasil/gestorpro`  
**Documento funcional principal:** `docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md`  
**Objetivo:** permitir que o projeto seja executado no Codex, fase por fase, sem depender de novas conversas no ChatGPT.

---

# 1. COMO USAR ESTE ARQUIVO

Coloque este arquivo no repositório no caminho:

```text
docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md
```

Mantenha também a especificação principal em:

```text
docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md
```

O Codex deverá tratar os dois documentos como fontes de verdade:

1. `UNIMETRA_ESPECIFICACAO_MESTRE.md` define o produto, as regras, os módulos e os requisitos.
2. `UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md` define a ordem de execução, os critérios de aceite e os prompts de cada fase.

## Regra de uso

- Cole no Codex primeiro o **Prompt de Inicialização Geral**.
- Depois execute o **Prompt da Fase 0**.
- Ao finalizar uma fase, cole o **Prompt de Auditoria e Fechamento da Fase**.
- Se tudo passar, cole o prompt da fase seguinte.
- Não pule fases.
- Não autorize o Codex a continuar automaticamente para a próxima fase.
- Não aceite uma fase como concluída apenas porque a interface “parece pronta”.

---

# 2. PREPARAÇÃO MANUAL ANTES DO CODEX

## 2.1 Estrutura mínima esperada

Na pasta local selecionada no Codex, deve existir:

```text
<raiz-do-projeto>/
├── .git/
├── docs/
│   └── product/
│       ├── UNIMETRA_ESPECIFICACAO_MESTRE.md
│       └── UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md
└── ...
```

## 2.2 Segurança do repositório

O repositório informado estava público na data de criação deste guia. Para um sistema proprietário de saúde ocupacional, recomenda-se torná-lo privado antes do desenvolvimento.

Nunca devem ser enviados ao GitHub:

- `.env`;
- `.env.local`;
- tokens;
- senhas;
- chaves privadas;
- service-role keys;
- certificados;
- dumps de banco;
- dados reais de pacientes;
- documentos médicos reais;
- backups reais;
- arquivos de produção contendo dados pessoais.

## 2.3 Branches

Usar uma branch por fase ou conjunto pequeno de tarefas.

Sugestão:

```text
main
chore/fase-0-fundacao
feat/fase-1-plataforma-seguranca
feat/fase-2-dominio-ocupacional
feat/fase-3-encaminhamento-agenda
feat/fase-4-checkin-fluxo-filas
feat/fase-5-painel-chamadas
feat/fase-6-triagem-consulta
feat/fase-7a-acuidade
feat/fase-7b-audiometria
feat/fase-7c-espirometria
feat/fase-7d-ecg
feat/fase-7e-laboratorio
feat/fase-7f-outros-exames
feat/fase-8-documentos
feat/fase-9-financeiro-portal
feat/fase-10-integracoes
chore/fase-11-producao-piloto
```

Nunca programar diretamente na `main`.

---

# 3. ARQUIVOS DE CONTROLE OBRIGATÓRIOS

O Codex deve criar e manter os seguintes arquivos durante todo o projeto:

```text
docs/status/PROJECT_STATUS.md
docs/status/PHASE_HISTORY.md
docs/status/OPEN_ISSUES.md
docs/status/HUMAN_VALIDATIONS.md
docs/status/TECHNICAL_DEBT.md
docs/status/NEXT_ACTION.md
docs/status/COMMAND_LOG.md
docs/status/FILE_CHANGE_LOG.md
```

## 3.1 PROJECT_STATUS.md

Deve conter:

- fase atual;
- branch atual;
- último commit local;
- módulos concluídos;
- módulos em andamento;
- módulos não iniciados;
- testes passando;
- testes falhando;
- migrations aplicadas;
- riscos abertos;
- decisões pendentes;
- próximo passo autorizado;
- data da última atualização.

## 3.2 PHASE_HISTORY.md

Para cada fase:

- início;
- término;
- branch;
- escopo;
- entregas;
- testes;
- problemas encontrados;
- correções realizadas;
- validações humanas pendentes;
- decisão de aceite.

## 3.3 NEXT_ACTION.md

Deve sempre conter apenas a próxima ação autorizada. Quando uma fase terminar, o Codex deve registrar:

```text
STATUS: AGUARDANDO AUTORIZAÇÃO
PRÓXIMA FASE: Fase X
PROMPT RECOMENDADO: <resumo do prompt a executar>
```

O Codex não pode iniciar a próxima fase enquanto este status não for alterado por uma nova instrução do usuário.

---

# 4. REGRAS GERAIS OBRIGATÓRIAS PARA TODAS AS FASES

Estas regras valem mesmo quando não forem repetidas em um prompt específico.

1. Ler integralmente a especificação e este guia antes de trabalhar.
2. Verificar branch, Git e arquivos alterados antes de editar.
3. Não trabalhar diretamente na `main`.
4. Não apagar funcionalidades ou dados sem plano explícito.
5. Não criar migrations destrutivas sem estratégia expand/contract.
6. Não usar dados reais.
7. Não expor segredos.
8. Não registrar dados clínicos em logs.
9. Não confiar em `tenant_id` vindo do cliente.
10. Aplicar autorização no backend.
11. Usar RLS como camada adicional de isolamento.
12. Não desabilitar RLS para “resolver” problemas.
13. Não permitir que empresa acesse prontuário clínico completo.
14. Não automatizar decisão médica final.
15. Não concluir ASO automaticamente.
16. Não sobrescrever documento emitido.
17. Não apagar histórico clínico.
18. Não alterar retroativamente PCMSO já usado.
19. Não usar Realtime como fonte oficial do estado.
20. Persistir antes de publicar evento.
21. Usar transações para operações críticas.
22. Usar idempotência onde houver risco de duplicidade.
23. Usar outbox para efeitos externos após commit.
24. Não criar excesso de cards.
25. Priorizar tabelas, listas, filas, drawers, stepper e timeline.
26. Criar loading, empty, error e permission-denied states.
27. Criar testes positivos e negativos.
28. Rodar lint, typecheck, testes e build antes de concluir cada tarefa.
29. Atualizar documentação e arquivos de status.
30. Parar ao final da fase e aguardar novo comando.

---

# 5. PROMPT DE INICIALIZAÇÃO GERAL

Cole este prompt apenas na primeira conversa do Codex ou sempre que abrir um novo ambiente sem contexto.

```text
Você está trabalhando no repositório local conectado a:
https://github.com/mentorupbrasil/gestorpro

Leia integralmente, antes de editar qualquer arquivo:

1. docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md
2. docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md

Esses dois arquivos são as fontes de verdade do projeto.

Antes de qualquer alteração:

- confirme a raiz do repositório;
- confirme o remote origin;
- confirme a branch atual;
- execute git status;
- liste arquivos existentes;
- procure arquivos sensíveis ou segredos versionados;
- leia docs/status/PROJECT_STATUS.md, se existir;
- leia docs/status/NEXT_ACTION.md, se existir;
- leia os ADRs e o histórico da fase atual, se existirem.

Não trabalhe diretamente na branch main.
Não inicie fase diferente da expressamente autorizada nesta conversa.
Não prossiga automaticamente para outra fase.
Não use dados reais.
Não faça alterações destrutivas.
Não crie funcionalidades fora do escopo autorizado.

Ao iniciar uma tarefa:

1. apresente o diagnóstico;
2. liste os arquivos que pretende criar ou alterar;
3. liste os comandos previstos;
4. identifique riscos;
5. execute apenas o escopo autorizado;
6. rode todas as verificações aplicáveis;
7. atualize docs/status/;
8. apresente um relatório final completo;
9. pare e aguarde nova instrução.
```

---

# 6. PROMPT UNIVERSAL PARA RETOMAR EM UMA NOVA CONVERSA DO CODEX

Use este prompt se o Codex perder o histórico, se você fechar a conversa ou iniciar outra sessão.

```text
Retome o projeto Unimetra usando exclusivamente o estado registrado no repositório.

Leia nesta ordem:

1. docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md
2. docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md
3. docs/status/PROJECT_STATUS.md
4. docs/status/NEXT_ACTION.md
5. docs/status/PHASE_HISTORY.md
6. docs/status/OPEN_ISSUES.md
7. docs/status/HUMAN_VALIDATIONS.md
8. docs/status/TECHNICAL_DEBT.md
9. docs/decisions/
10. documentação específica da fase atual.

Depois:

- confirme o repositório remoto;
- confirme branch e git status;
- identifique alterações não commitadas;
- rode verificações não destrutivas;
- resuma o estado real do projeto;
- diga exatamente qual é a próxima ação autorizada.

Não modifique nenhum arquivo até concluir esse diagnóstico.
Não avance de fase automaticamente.
```

---

# 7. FASE 0 — DESCOBERTA, ARQUITETURA E FUNDAÇÃO DOCUMENTAL

## Objetivo

Definir a fundação do projeto antes de iniciar código funcional.

## Branch

```text
chore/fase-0-fundacao
```

## Prompt da Fase 0

```text
Execute exclusivamente a Fase 0 do projeto Unimetra, conforme:

- docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md
- docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md

Este é um projeto greenfield. Não existe sistema legado a preservar.

Crie ou confirme a branch:
chore/fase-0-fundacao

Nesta fase, você pode criar apenas documentação, modelos, diagramas, ADRs, arquivos de governança e arquivos de status.

Não inicialize Next.js.
Não instale dependências.
Não implemente componentes.
Não crie banco real.
Não crie migrations executáveis.
Não conecte serviços externos.
Não configure deploy.
Não implemente autenticação.
Não implemente módulos clínicos.

Crie e revise os entregáveis definidos para a Fase 0, incluindo:

- README.md;
- AGENTS.md;
- visão geral da arquitetura;
- modelo de domínio;
- mapa de módulos;
- segurança;
- multitenancy;
- Realtime e filas;
- documentos;
- topologia de deploy;
- DBML inicial;
- dicionário de dados;
- estratégia de migrations;
- estratégia de RLS;
- matriz de permissões;
- threat model;
- classificação de dados;
- fluxos e máquinas de estado;
- estratégia de testes;
- plano de backup;
- resposta a incidentes;
- roadmap;
- plano detalhado da Fase 1;
- registro de riscos;
- decisões abertas;
- ADRs iniciais;
- arquivos docs/status/ obrigatórios.

Analise criticamente as tecnologias sugeridas. Não aceite automaticamente cada escolha. Registre riscos, alternativas, lock-in, custo e necessidade no MVP.

Todos os ADRs ainda não aprovados devem ficar com status PROPOSTA.

Antes de criar arquivos, apresente:

1. verificação do repositório;
2. branch;
3. estrutura documental proposta;
4. lista exata de arquivos;
5. riscos imediatos;
6. decisões ainda humanas.

Ao finalizar:

- revise consistência entre documentos;
- valide links internos;
- valide Mermaid e DBML quando houver ferramenta disponível;
- atualize docs/status/;
- apresente relatório completo;
- não faça commit ou push sem autorização;
- não inicie a Fase 1.
```

## Critérios de aceite da Fase 0

- arquitetura coerente;
- módulos claramente separados;
- modelo de domínio inicial compreensível;
- multitenancy definido;
- permissões definidas;
- máquinas de estado definidas;
- DBML inicial revisável;
- riscos documentados;
- decisões humanas separadas das decisões técnicas;
- Fase 1 dividida em tarefas pequenas;
- nenhum código funcional criado;
- nenhum serviço externo conectado;
- arquivos de status criados.

---

# 8. PROMPT DE AUDITORIA E FECHAMENTO DE QUALQUER FASE

Cole este prompt sempre que o Codex disser que uma fase terminou.

```text
Antes de considerar esta fase concluída, execute uma auditoria completa do próprio trabalho.

1. Compare cada entrega com:
   - docs/product/UNIMETRA_ESPECIFICACAO_MESTRE.md
   - docs/product/UNIMETRA_GUIA_COMPLETO_DE_EXECUCAO_NO_CODEX.md
   - critérios de aceite da fase atual.

2. Liste cada requisito da fase com status:
   - ATENDIDO;
   - PARCIAL;
   - NÃO ATENDIDO;
   - BLOQUEADO POR VALIDAÇÃO HUMANA.

3. Procure:
   - código incompleto;
   - mocks apresentados como funcionalidade real;
   - TODOs críticos;
   - migrations perigosas;
   - falhas de autorização;
   - falhas de RLS;
   - vazamento entre tenants;
   - dados sensíveis em logs;
   - segredos no repositório;
   - dependências desnecessárias;
   - telas sem loading, empty ou error state;
   - funções sem teste;
   - testes superficiais;
   - erros ocultos por try/catch genérico;
   - alterações fora de escopo;
   - dívida técnica não registrada.

4. Execute todas as verificações aplicáveis:
   - git diff;
   - lint;
   - formatação;
   - typecheck;
   - testes unitários;
   - testes de integração;
   - testes de autorização/RLS;
   - testes E2E;
   - build;
   - migrations em banco descartável;
   - verificação de segredos;
   - verificação de dependências;
   - acessibilidade;
   - análise de segurança, quando disponível.

5. Corrija automaticamente apenas problemas dentro do escopo da fase.

6. Se houver problema fora do escopo, registre em:
   - docs/status/OPEN_ISSUES.md;
   - docs/status/TECHNICAL_DEBT.md;
   - docs/status/HUMAN_VALIDATIONS.md.

7. Atualize:
   - docs/status/PROJECT_STATUS.md;
   - docs/status/PHASE_HISTORY.md;
   - docs/status/NEXT_ACTION.md;
   - docs/status/COMMAND_LOG.md;
   - docs/status/FILE_CHANGE_LOG.md.

8. Apresente o relatório final com:
   - escopo entregue;
   - arquivos alterados;
   - migrations;
   - comandos;
   - testes e resultados;
   - falhas restantes;
   - riscos;
   - validações humanas;
   - dívida técnica;
   - rollback;
   - recomendação sobre aceitar ou rejeitar a fase.

Não inicie a próxima fase.
```

---

# 9. PROMPT PARA CORRIGIR UMA FASE REPROVADA

```text
A fase atual não foi aceita.

Use o relatório de auditoria e corrija exclusivamente os itens marcados como PARCIAL ou NÃO ATENDIDO que pertencem ao escopo desta fase.

Não adicione funcionalidades da fase seguinte.
Não amplie o escopo.
Não esconda falhas removendo testes.
Não desabilite validações, RLS, lint ou TypeScript.
Não substitua implementação real por mock.

Após as correções:

- execute novamente todos os testes aplicáveis;
- atualize os arquivos em docs/status/;
- reapresente a matriz de critérios de aceite;
- informe se a fase pode ser aceita;
- pare sem iniciar a próxima fase.
```

---

# 10. FASE 1 — PLATAFORMA, SEGURANÇA E ISOLAMENTO

## Objetivo

Criar a fundação técnica executável, sem módulos clínicos.

## Branch

```text
feat/fase-1-plataforma-seguranca
```

## Escopo

- inicialização do projeto;
- TypeScript estrito;
- lint e formatação;
- testes;
- CI;
- estrutura modular;
- ambientes;
- Supabase local/desenvolvimento;
- Drizzle e migrations;
- autenticação;
- tenants;
- unidades;
- memberships;
- papéis;
- permissões;
- RLS;
- auditoria;
- observabilidade básica;
- comprovação de isolamento entre tenants.

## Prompt da Fase 1

```text
Execute exclusivamente a Fase 1 — Plataforma, Segurança e Isolamento.

Leia toda a documentação da Fase 0 e confirme que a fase foi aceita.

Crie a branch:
feat/fase-1-plataforma-seguranca

Implemente em tarefas pequenas, seguindo docs/planning/phase-1-plan.md.

A fase deve incluir:

1. inicialização segura do projeto;
2. TypeScript strict;
3. lint e formatação;
4. estrutura modular aprovada no ADR;
5. Vitest e Playwright;
6. CI no GitHub Actions;
7. documentação de ambientes;
8. configuração local segura;
9. banco e migrations iniciais;
10. autenticação;
11. tenants;
12. clinic_units;
13. tenant_memberships;
14. roles e permissions;
15. vínculo de papéis e permissões;
16. autorização server-side;
17. RLS;
18. audit_logs append-only;
19. request ID;
20. tratamento padronizado de erros;
21. observabilidade básica;
22. testes de isolamento entre tenants.

Não implemente empresas, trabalhadores, PCMSO, agenda, atendimento, exames, ASO ou financeiro.

Requisitos obrigatórios:

- tenant_id nunca é confiado ao cliente;
- tenant é resolvido pela sessão e membership;
- RLS não substitui autorização de aplicação;
- service role nunca vai ao browser;
- migrations pequenas e testáveis;
- nenhuma credencial versionada;
- usuário bloqueado perde acesso;
- perfis críticos preparados para MFA;
- auditoria não contém dados clínicos;
- teste negativo de tenant A acessando tenant B;
- teste de elevação de privilégio;
- teste de rota sem sessão;
- teste de rota com permissão insuficiente.

Antes de alterar arquivos, apresente plano, arquivos e migrations previstos.

Ao finalizar:

- execute lint;
- typecheck;
- testes unitários;
- testes de integração;
- testes RLS;
- E2E mínimo de login e isolamento;
- build;
- verificação de segredos;
- teste de migrations em banco descartável;
- atualize docs/status/;
- pare sem iniciar a Fase 2.
```

## Critérios de aceite da Fase 1

- aplicação inicializa;
- CI passa;
- autenticação funciona;
- tenant é resolvido com segurança;
- isolamento comprovado;
- RLS testada;
- autorização server-side presente;
- auditoria básica funcional;
- nenhuma entidade clínica implementada;
- nenhum segredo exposto.

---

# 11. FASE 2 — EMPRESAS, TRABALHADORES, PCMSO E PROTOCOLOS

## Branch

```text
feat/fase-2-dominio-ocupacional
```

## Prompt da Fase 2

```text
Execute exclusivamente a Fase 2 — Empresas, Trabalhadores, PCMSO e Protocolos.

Confirme que a Fase 1 foi aceita e que os testes continuam passando.

Crie a branch:
feat/fase-2-dominio-ocupacional

Implemente em blocos pequenos:

1. companies;
2. company_establishments;
3. company_contacts;
4. sectors;
5. job_positions;
6. exposure_groups;
7. occupational_risks;
8. risk_assignments versionados;
9. workers;
10. identificadores e deduplicação;
11. employment_contracts;
12. histórico de vínculo;
13. pcmso_programs;
14. pcmso_versions;
15. aprovações e vigência;
16. exam_catalog;
17. exam_protocols;
18. exam_protocol_rules;
19. exam_protocol_items;
20. exceções;
21. tabelas de preço, apenas como domínio comercial separado;
22. motor de cálculo de exames;
23. testes do motor.

Regras obrigatórias:

- empresa, estabelecimento, setor, função, GHE e riscos respeitam tenant;
- histórico não é apagado;
- PCMSO usado não pode ser alterado retroativamente;
- versões aprovadas são imutáveis;
- protocolo ausente gera erro explícito;
- conflito de protocolo gera pendência, não decisão silenciosa;
- inclusão ou remoção manual exige permissão, justificativa e auditoria;
- pacote comercial não substitui protocolo clínico;
- motor de exames deve ser função de domínio testável;
- nenhuma decisão de aptidão;
- nenhum atendimento clínico ainda.

Crie telas operacionais limpas, sem excesso de cards, somente para cadastros da fase.

Inclua testes:

- vigência de PCMSO;
- conflito de versões;
- função/GHE/riscos;
- exames por tipo ocupacional;
- exceções;
- protocolo ausente;
- override permitido e negado;
- isolamento de tenant;
- histórico de vínculos;
- duplicidade de trabalhador.

Ao finalizar, rode todas as verificações e pare sem iniciar a Fase 3.
```

## Critérios de aceite da Fase 2

- empresa e estrutura ocupacional funcionam;
- trabalhadores e vínculos versionam;
- PCMSO versiona e respeita vigência;
- catálogo existe;
- motor calcula exames corretamente;
- conflitos e ausências bloqueiam;
- overrides são auditados;
- preço não interfere em regra clínica.

---

# 12. FASE 3 — ENCAMINHAMENTOS, IMPORTAÇÃO E AGENDA

## Branch

```text
feat/fase-3-encaminhamento-agenda
```

## Prompt da Fase 3

```text
Execute exclusivamente a Fase 3 — Encaminhamentos, Importação e Agenda.

Crie a branch:
feat/fase-3-encaminhamento-agenda

Implemente:

1. referrals;
2. referral_items;
3. estados do encaminhamento;
4. divergências cadastrais;
5. prévia dos exames;
6. validade;
7. importação CSV/XLSX;
8. template oficial;
9. validação por linha;
10. prévia antes de gravar;
11. importação idempotente;
12. correção de linhas inválidas;
13. appointments;
14. recursos de agenda;
15. agenda por unidade, sala, profissional e procedimento;
16. bloqueios;
17. conflitos;
18. encaixe;
19. lista de espera;
20. confirmação, cancelamento e reagendamento;
21. orientações de preparo;
22. permissões e RLS;
23. telas operacionais da recepção e agenda.

Regras:

- agendamento não cria atendimento clínico;
- cancelamento não apaga histórico;
- conflito de sala/profissional deve bloquear, salvo autorização configurada;
- importação não pode falhar silenciosamente;
- não importar parcialmente sem relatório claro;
- todas as operações devem ser tenant-scoped;
- empresa só vê dados autorizados;
- nenhuma informação clínica indevida no portal.

Testes mínimos:

- transições de estado;
- importação válida;
- linhas inválidas;
- repetição da importação;
- conflito de agenda;
- reagendamento;
- cancelamento;
- tenant A versus tenant B;
- permissões de recepção e empresa.

Ao concluir, audite, atualize docs/status/ e pare sem iniciar a Fase 4.
```

---

# 13. FASE 4 — CHECK-IN, SNAPSHOT, ETAPAS E FILAS

## Branch

```text
feat/fase-4-checkin-fluxo-filas
```

## Prompt da Fase 4

```text
Execute exclusivamente a Fase 4 — Check-in, Snapshot, Etapas e Filas.

Crie a branch:
feat/fase-4-checkin-fluxo-filas

Esta é uma fase crítica. Implemente em incrementos pequenos e testados.

Entregas:

1. encounters;
2. encounter_snapshots imutáveis;
3. encounter_steps;
4. dependências entre etapas;
5. encounter_events;
6. máquina de estados do atendimento;
7. máquina de estados das etapas;
8. transação atômica de check-in;
9. idempotency_keys;
10. outbox_events;
11. exam_orders iniciais;
12. queue_definitions;
13. queue_tickets;
14. prioridade e ordenação;
15. liberação e bloqueio de etapas;
16. recálculo do fluxo;
17. telas operacionais de check-in e filas;
18. tratamento de concorrência;
19. auditoria completa.

A transação de check-in deve:

- validar sessão e permissão;
- bloquear agendamento/encaminhamento;
- impedir atendimento ativo duplicado;
- resolver PCMSO e protocolo;
- criar encounter;
- criar snapshot;
- criar exam_orders;
- criar encounter_steps;
- criar ticket da primeira fila;
- criar auditoria;
- criar outbox;
- atualizar agendamento/encaminhamento;
- fazer rollback integral em qualquer falha.

Regras:

- duplo clique não cria atendimento duplicado;
- snapshot não depende de cadastros futuros;
- etapa concluída não é apagada;
- inclusão posterior cria nova etapa/evento;
- reordenação manual exige justificativa;
- nenhuma transição crítica somente no frontend;
- conflito otimista retorna 409;
- banco é a fonte oficial.

Testes obrigatórios:

- check-in feliz;
- duplo clique;
- duas requisições concorrentes;
- protocolo ausente;
- falha no meio da transação;
- snapshot preservado após mudança cadastral;
- dependências;
- liberação de etapas;
- fila e prioridade;
- tenant isolation;
- permissões;
- outbox criada no mesmo commit.

Ao finalizar, execute auditoria reforçada e pare sem iniciar a Fase 5.
```

---

# 14. FASE 5 — PAINEL DE CHAMADAS E REALTIME

## Branch

```text
feat/fase-5-painel-chamadas
```

## Prompt da Fase 5

```text
Execute exclusivamente a Fase 5 — Painel de Chamadas e Realtime.

Crie a branch:
feat/fase-5-painel-chamadas

Implemente:

1. display_panels;
2. sessões de painel;
3. heartbeats;
4. call_events;
5. call_deliveries;
6. autenticação do dispositivo;
7. canal privado por tenant e unidade;
8. ações chamar, rechamar, compareceu, iniciar, devolver, não compareceu e redirecionar;
9. atualização condicional para impedir duas salas chamarem o mesmo paciente;
10. payload mínimo e privado;
11. voz pt-BR com fila de áudio;
12. prevenção de sobreposição;
13. botão de ativação de áudio;
14. confirmação de recebimento;
15. reconexão;
16. recuperação de chamada ativa;
17. reconciliação periódica;
18. histórico recente;
19. status online/offline;
20. fallback visual.

Regras:

- persistir chamada antes de publicar;
- Realtime é transporte, não fonte oficial;
- TV não recebe CPF, empresa, exame, diagnóstico ou resultado;
- canais privados;
- dispositivo revogável;
- falha de áudio não impede exibição;
- duas salas não podem chamar o mesmo ticket;
- painel deve recuperar estado após recarregar.

Testes:

- duas chamadas concorrentes;
- painel desconectado;
- reconexão;
- evento duplicado;
- confirmação;
- dispositivo revogado;
- tenant errado;
- payload sem dados proibidos;
- fallback sem voz.

Ao concluir, pare sem iniciar a Fase 6.
```

---

# 15. FASE 6 — TRIAGEM, CONSULTA E CONCLUSÃO MÉDICA

## Branch

```text
feat/fase-6-triagem-consulta
```

## Prompt da Fase 6

```text
Execute exclusivamente a Fase 6 — Triagem, Consulta e Conclusão Médica.

Crie a branch:
feat/fase-6-triagem-consulta

Implemente:

1. formulários versionados de triagem;
2. triage_records;
3. triage_record_versions;
4. alertas clínicos auxiliares;
5. reconhecimento de alertas;
6. intercorrência e pausa do fluxo;
7. medical_consultations;
8. versões e adendos;
9. rascunho seguro;
10. salvamento explícito;
11. fechamento e reabertura controlada;
12. medical_conclusions;
13. restrições configuráveis;
14. bloqueios de conclusão;
15. vínculo do médico e registro profissional;
16. autorização por perfil e escopo;
17. preparação de assinatura autenticada;
18. timeline clínica;
19. layout clínico limpo.

Regras:

- alteração após fechamento gera versão/adendo;
- alerta não é diagnóstico;
- aptidão final é decisão do médico;
- não concluir com exames obrigatórios pendentes;
- não concluir com PCMSO inválido;
- recepção não vê conteúdo clínico detalhado;
- empresa não vê prontuário;
- suporte não possui acesso clínico por padrão;
- reabertura exige permissão e justificativa;
- auditoria de leitura sensível.

Testes:

- triagem completa;
- correção versionada;
- alerta reconhecido;
- médico sem vínculo;
- CRM ausente;
- conclusão bloqueada;
- reabertura autorizada e negada;
- recepção tentando acessar prontuário;
- empresa tentando acessar prontuário;
- isolamento entre tenants;
- auditoria de acesso.

Não gere ASO definitivo nesta fase. Prepare o domínio para a Fase 8.

Ao concluir, pare sem iniciar a Fase 7.
```

---

# 16. FASE 7 — EXAMES COMPLEMENTARES

A Fase 7 deve ser dividida. Não implemente todos os exames em uma única tarefa.

## 16.1 Fase 7A — Acuidade Visual

### Branch

```text
feat/fase-7a-acuidade
```

### Prompt

```text
Execute exclusivamente a Fase 7A — Acuidade Visual.

Implemente o fluxo completo usando exam_orders e versões de resultado:

- iniciar exame;
- registrar por olho;
- com e sem correção;
- perto e longe;
- binocular;
- condições do teste;
- equipamento/tabela;
- observações;
- conclusão profissional;
- correção versionada;
- repetição sem apagar histórico;
- conclusão da etapa;
- liberação da próxima etapa.

Inclua autorização, RLS, auditoria, concorrência, validações e testes E2E do fluxo.

Não implemente outros exames.
Pare ao concluir.
```

## 16.2 Fase 7B — Audiometria

### Branch

```text
feat/fase-7b-audiometria
```

### Prompt

```text
Execute exclusivamente a Fase 7B — Audiometria.

Implemente:

- dados ocupacionais necessários;
- repouso auditivo informado;
- queixas;
- otoscopia quando configurada;
- limiares por frequência e ouvido;
- via aérea/óssea quando aplicável;
- mascaramento;
- equipamento;
- cabine;
- calibração vigente;
- profissional habilitado;
- audiograma;
- comparação com exame anterior;
- laudo;
- versões;
- repetição;
- importação futura preparada, sem inventar protocolo universal.

Bloqueie conclusão com dados obrigatórios incompletos ou calibração inválida, conforme configuração aprovada.

Preserve payload original em importações futuras e dados normalizados.

Crie testes de domínio, integração e E2E.
Não implemente espirometria ou outro exame.
Pare ao concluir.
```

## 16.3 Fase 7C — Espirometria

### Branch

```text
feat/fase-7c-espirometria
```

### Prompt

```text
Execute exclusivamente a Fase 7C — Espirometria.

Implemente:

- dados necessários ao cálculo;
- tentativas/manobras;
- valores medidos;
- valores previstos configuráveis e tecnicamente validados;
- percentuais;
- curvas e anexos;
- seleção de tentativa aceita;
- qualidade técnica;
- equipamento;
- calibração/verificação;
- broncodilatador quando aplicável;
- conclusão profissional;
- exame inconclusivo;
- repetição sem apagar tentativa anterior;
- versões e auditoria.

Não invente interpretação clínica. Implemente apenas cálculos e validações aprováveis/configuráveis.

Crie testes completos.
Pare ao concluir.
```

## 16.4 Fase 7D — ECG, EEG e Radiologia

### Branch

```text
feat/fase-7d-ecg-eeg-radiologia
```

### Prompt

```text
Execute exclusivamente a Fase 7D — ECG, EEG e Radiologia.

Implemente um modelo comum para:

- solicitação;
- preparo;
- execução;
- equipamento;
- arquivo bruto quando disponível;
- imagem/PDF;
- executor;
- laudador;
- datas separadas;
- laudo;
- conclusão;
- status;
- versões;
- resultado externo validado.

Não tente interpretar automaticamente os exames.
Não crie integração com equipamento sem documentação oficial.
Inclua storage privado, autorização, auditoria e testes.
Pare ao concluir.
```

## 16.5 Fase 7E — Laboratório

### Branch

```text
feat/fase-7e-laboratorio
```

### Prompt

```text
Execute exclusivamente a Fase 7E — Laboratório.

Implemente:

- laboratory_orders;
- itens;
- samples;
- eventos de amostra;
- coleta;
- recebimento;
- processamento;
- resultado;
- revisão/liberação;
- referência configurável;
- resultado crítico e confirmação;
- repetição;
- laboratório externo;
- código de barras/QR opcional;
- rastreabilidade;
- integração futura preparada.

Não implemente HL7/FHIR real nesta fase, salvo autorização separada e documentação oficial.

Crie testes de rastreabilidade, autorização, versões e fluxo completo.
Pare ao concluir.
```

## 16.6 Fase 7F — Avaliações e Outros Exames

### Branch

```text
feat/fase-7f-outros-exames
```

### Prompt

```text
Execute exclusivamente a Fase 7F — Avaliações Psicossociais e Outros Exames.

Implemente:

- questionários versionados;
- respostas estruturadas;
- escalas configuráveis;
- cálculo auxiliar apenas quando validado;
- resultado final por profissional habilitado;
- visibilidade reforçada;
- documento de conclusão separado do conteúdo completo;
- exames externos genéricos;
- anexos privados;
- validação e auditoria.

Não exponha detalhes sensíveis à empresa.
Não automatize diagnóstico.
Crie testes completos e pare ao concluir.
```

## Critério de aceite geral da Fase 7

- cada exame usa o fluxo comum de `exam_orders`;
- resultados são versionados;
- repetição não apaga histórico;
- autorização por especialidade/perfil;
- equipamento e calibração tratados;
- liberação de etapas funciona;
- consulta recebe resultados;
- testes de todos os submódulos passam.

---

# 17. FASE 8 — DOCUMENTOS, ASO, ASSINATURA E IMPRESSÃO

## Branch

```text
feat/fase-8-documentos
```

## Prompt da Fase 8

```text
Execute exclusivamente a Fase 8 — Documentos, ASO, Assinatura e Impressão.

Crie a branch:
feat/fase-8-documentos

Implemente:

1. document_templates;
2. versões;
3. campos e variáveis;
4. preview com dados fictícios;
5. snapshot documental;
6. renderização;
7. geração de PDF;
8. workflow durável;
9. hash;
10. storage privado;
11. generated_documents;
12. document_versions;
13. retificação;
14. versão vigente;
15. assinatura autenticada inicial;
16. reautenticação/MFA quando exigido;
17. document_deliveries;
18. document_access_logs;
19. URLs assinadas temporárias;
20. impressão A4 pelo navegador;
21. número de vias configurável;
22. ASO;
23. fichas e laudos prioritários.

Regras obrigatórias:

- documento emitido é imutável;
- correção gera nova versão;
- versão anterior permanece;
- hash é preservado;
- nenhum PDF clínico em bucket público;
- download é autorizado e auditado;
- nome físico não revela diagnóstico;
- ASO não é gerado/liberado incompleto;
- aptidão vem da conclusão médica, não de regra automática;
- assinatura registra signatário, data, método, IP, user agent, nível de autenticação e hash;
- não prometer conversão perfeita de qualquer PDF/DOCX;
- impressão automática silenciosa fica para conector futuro.

Testes:

- geração feliz;
- falha e retry;
- idempotência;
- PDF duplicado;
- documento retificado;
- URL expirada;
- usuário sem permissão;
- tenant errado;
- ASO com pendência;
- assinatura inválida;
- storage indisponível;
- auditoria de download.

Ao concluir, pare sem iniciar a Fase 9.
```

---

# 18. FASE 9 — FINANCEIRO, FATURAMENTO E PORTAL EMPRESARIAL

## Branch

```text
feat/fase-9-financeiro-portal
```

## Prompt da Fase 9

```text
Execute exclusivamente a Fase 9 — Financeiro, Faturamento e Portal Empresarial.

Crie a branch:
feat/fase-9-financeiro-portal

Implemente:

1. contratos;
2. tabelas de preço versionadas;
3. snapshot de preço no atendimento;
4. quotes e quote_items;
5. aprovação e conversão;
6. billing_items;
7. invoices;
8. invoice_items;
9. payments;
10. ajustes;
11. glosas;
12. estados de faturamento;
13. relatórios;
14. portal empresarial;
15. usuários da empresa;
16. trabalhadores e encaminhamentos permitidos;
17. agenda permitida;
18. status operacionais seguros;
19. documentos autorizados;
20. matriz de entrega documental;
21. notificações internas básicas.

Regras:

- preço comercial não altera protocolo clínico;
- preço do atendimento é snapshot;
- repetição técnica pode ser não cobrável;
- ajuste exige justificativa;
- empresa não acessa prontuário;
- empresa não acessa observações internas;
- status não revela informação médica indevida;
- documentos só aparecem se liberados;
- isolamento por empresa e tenant;
- relatórios respeitam contrato e permissão.

Testes:

- vigência de preço;
- alteração posterior sem mudar histórico;
- orçamento convertido;
- faturamento;
- glosa;
- empresa A tentando acessar empresa B;
- usuário empresarial tentando abrir prontuário;
- documento não liberado;
- relatório autorizado e negado.

Ao concluir, pare sem iniciar a Fase 10.
```

---

# 19. FASE 10 — INTEGRAÇÕES, ESOCIAL, MENSAGENS E CONECTOR

Esta fase deve ser executada em subfases. Não implemente todas as integrações juntas.

## 19.1 Fase 10A — Infraestrutura de Integrações e Webhooks

```text
Execute exclusivamente a Fase 10A — Infraestrutura de Integrações e Webhooks.

Implemente conexões, credenciais seguras, jobs, webhooks, entregas, retries, backoff, dead-letter, idempotência, assinatura de webhook, logs redigidos e reprocessamento manual.

Não implemente eSocial, WhatsApp ou equipamento específico ainda.
Pare ao concluir.
```

## 19.2 Fase 10B — eSocial

```text
Execute exclusivamente a Fase 10B — eSocial.

Antes de implementar, consulte a documentação oficial vigente.
Registre a versão do layout e a data da consulta.

Implemente o domínio interno, validação, estados, payload versionado, lote, envio por workflow, recibos, erros, rejeição, correção, retificação e reenvio idempotente.

Separe produção restrita e produção.
Não invente campos ou regras.
Nunca apague rejeições.
Não exponha credenciais.
Crie testes com payloads fictícios.
Pare ao concluir.
```

## 19.3 Fase 10C — Mensagens

```text
Execute exclusivamente a Fase 10C — Mensagens e Notificações.

Implemente infraestrutura para e-mail, WhatsApp oficial, SMS, notificação interna e webhook, ativando somente provedores autorizados.

Use templates versionados, consentimento/base adequada, fila durável, retry, idempotência, opt-out quando aplicável e registro de entrega.

Não inclua conteúdo clínico sensível em mensagens abertas.
Não use integração não oficial de WhatsApp.
Pare ao concluir.
```

## 19.4 Fase 10D — Equipamentos e Conector Local

```text
Execute exclusivamente a Fase 10D — Equipamentos e Conector Local.

Implemente cadastro, calibração, manutenção, bloqueios configuráveis e arquitetura do conector local.

Integre equipamento específico somente quando houver documentação/SDK oficial validado.

O conector deve usar autenticação de dispositivo, escopo mínimo, idempotência, criptografia local, logs sem dados desnecessários e atualização segura.

Implemente inicialmente apenas as capacidades expressamente autorizadas.
Não prometa integração universal.
Pare ao concluir.
```

---

# 20. FASE 11 — PRODUÇÃO, SEGURANÇA, CONTINGÊNCIA E PILOTO

## Branch

```text
chore/fase-11-producao-piloto
```

## Prompt da Fase 11

```text
Execute exclusivamente a Fase 11 — Preparação de Produção e Piloto.

Crie a branch:
chore/fase-11-producao-piloto

Não coloque o sistema em produção automaticamente.
Prepare, teste e documente.

Entregas:

1. revisão geral de segurança;
2. revisão de dependências;
3. testes de autorização e RLS;
4. testes de carga;
5. testes de concorrência;
6. testes E2E completos;
7. análise de logs;
8. validação de observabilidade;
9. alertas;
10. backup;
11. PITR, quando contratado;
12. dump lógico externo;
13. backup de Storage;
14. teste de restauração;
15. RPO e RTO;
16. runbooks;
17. plano de contingência;
18. procedimento de queda de internet;
19. procedimento de incidente;
20. plano de comunicação;
21. treinamento;
22. checklist de produção;
23. checklist de piloto;
24. feature flags;
25. rollout controlado;
26. rollback;
27. documentação de suporte;
28. matriz final de validações humanas.

Exija validação humana antes de produção por:

- responsável médico;
- profissionais executores;
- responsável técnico;
- jurídico/LGPD;
- segurança da informação;
- contabilidade/faturamento;
- responsável eSocial;
- fabricantes, quando houver integração;
- usuários de recepção, triagem e consultório.

Não declare produção aprovada se qualquer item crítico estiver pendente.
Não use dados reais em teste.
Não execute deploy final sem autorização expressa.

Ao concluir, apresente relatório GO/NO-GO com justificativas e pare.
```

---

# 21. PROMPT PARA APROVAR UMA FASE E LIBERAR A PRÓXIMA

Troque `X` e `Y` pelos números das fases.

```text
A Fase X foi aceita com base no relatório final e nos testes registrados.

Antes de iniciar a Fase Y:

1. atualize docs/status/PHASE_HISTORY.md com a decisão ACEITA;
2. atualize docs/status/PROJECT_STATUS.md;
3. atualize docs/status/NEXT_ACTION.md;
4. confirme que não há alterações desconhecidas;
5. confirme que a branch da Fase X está limpa;
6. confirme que todos os testes da Fase X continuam passando;
7. não altere a main diretamente;
8. crie a branch prevista para a Fase Y;
9. apresente o plano e os arquivos previstos;
10. execute exclusivamente a Fase Y conforme o guia.

Não inclua escopo de fases posteriores.
```

---

# 22. PROMPT PARA COMMIT E PUSH APÓS UMA FASE ACEITA

Use somente após conferir o relatório e decidir manter as alterações.

```text
A fase atual está aceita.

Prepare o versionamento das alterações desta fase.

Antes de commit:

- confirme branch;
- execute git status;
- revise git diff;
- confirme que nenhum segredo, .env, dado real, backup ou arquivo sensível será versionado;
- execute novamente lint, typecheck, testes e build aplicáveis;
- confirme que docs/status/ está atualizado.

Depois:

1. crie commits pequenos e semanticamente claros;
2. não use commit genérico como “updates”;
3. faça push somente da branch atual;
4. não faça merge na main;
5. apresente hashes dos commits;
6. apresente o link/identificação da branch remota;
7. prepare uma descrição de pull request contendo escopo, testes, migrations, riscos, rollback e validações humanas.

Não abra ou faça merge de pull request sem autorização expressa, salvo se a instrução atual autorizar claramente.
```

---

# 23. PROMPT PARA REVISÃO FINAL DE PULL REQUEST

```text
Revise a pull request da fase atual antes do merge.

Verifique:

- aderência ao escopo;
- alterações fora de fase;
- segurança;
- autorização;
- RLS;
- multitenancy;
- migrations;
- perda de dados;
- segredos;
- dados reais;
- testes;
- cobertura dos fluxos críticos;
- acessibilidade;
- desempenho;
- tratamento de erro;
- observabilidade;
- documentação;
- rollback;
- dívida técnica.

Liste achados por severidade:

- BLOQUEADOR;
- ALTO;
- MÉDIO;
- BAIXO;
- SUGESTÃO.

Não aprove o merge enquanto houver bloqueador ou risco alto sem resolução ou aceite humano documentado.
```

---

# 24. PROMPT PARA MERGE SEGURO

```text
A pull request foi revisada e está autorizada para merge.

Antes de executar:

- confirme que não existem bloqueadores;
- confirme checks verdes;
- confirme migrations revisadas;
- confirme plano de rollback;
- confirme branch e PR corretas;
- confirme ausência de segredo e dado real;
- confirme que a main está protegida.

Use o método de merge adotado no ADR do projeto.
Não faça deploy de produção automaticamente.

Após o merge:

- confirme o commit final na main;
- atualize o checkout local de forma segura;
- atualize docs/status/ na próxima branch, quando aplicável;
- informe qualquer conflito ou check pós-merge.
```

---

# 25. PROMPT PARA DIAGNOSTICAR ERROS SEM DESTRUIR O PROJETO

```text
O projeto apresenta um erro. Faça diagnóstico sistemático antes de editar.

1. reproduza o erro;
2. registre o comando e a saída;
3. identifique a camada afetada;
4. analise logs sem expor dados sensíveis;
5. verifique alterações recentes;
6. verifique migrations;
7. verifique ambiente e variáveis apenas pelos nomes, nunca pelos valores;
8. formule hipóteses;
9. teste a hipótese de menor risco;
10. aplique a menor correção possível;
11. crie teste de regressão;
12. rode a suíte relevante;
13. atualize docs/status/OPEN_ISSUES.md e PHASE_HISTORY.md.

Não:

- desabilite teste;
- use any para esconder erro de TypeScript;
- desabilite RLS;
- remova autorização;
- apague migration;
- resete banco com dados importantes;
- exponha segredo;
- faça alteração ampla sem demonstrar causa.
```

---

# 26. PROMPT PARA REVISÃO DE SEGURANÇA

```text
Execute uma revisão de segurança do escopo implementado, sem alterar funcionalidade inicialmente.

Analise:

- autenticação;
- sessão;
- autorização;
- tenant isolation;
- RLS;
- IDOR;
- elevação de privilégio;
- CSRF;
- XSS;
- upload;
- storage;
- URLs assinadas;
- rate limiting;
- enumeração de CPF;
- logs;
- analytics;
- segredos;
- dependências;
- headers;
- CSP;
- cookies;
- webhooks;
- dispositivos;
- auditoria;
- acesso emergencial;
- dados clínicos.

Produza achados com severidade, evidência, impacto, correção e teste de regressão.
Corrija somente após apresentar o relatório, salvo vulnerabilidade crítica óbvia que exija contenção imediata.
```

---

# 27. PROMPT PARA VERIFICAR SE EXISTEM MOCKS OU FUNÇÕES FALSAS

```text
Audite o projeto para identificar funcionalidades que parecem prontas na interface, mas não estão realmente implementadas.

Procure:

- dados estáticos;
- arrays locais substituindo banco;
- mocks em produção;
- botões sem ação;
- formulários que não persistem;
- APIs fake;
- respostas hardcoded;
- TODOs críticos;
- catch que ignora erro;
- sucesso exibido sem confirmação do backend;
- permissões somente visuais;
- filtros apenas no frontend;
- documentos fictícios;
- chamadas Realtime sem persistência;
- testes que mockam toda a regra central.

Liste cada ocorrência com arquivo, linha, impacto e fase responsável pela correção.
Não declare uma funcionalidade pronta enquanto depender de mock não explicitamente permitido.
```

---

# 28. PROMPT PARA VERIFICAR QUALIDADE VISUAL E USABILIDADE

```text
Revise a interface implementada na fase atual conforme a direção visual do projeto.

Verifique:

- ausência de excesso de cards;
- hierarquia visual;
- tabelas e listas operacionais;
- filtros;
- drawers e modais;
- timeline e stepper;
- densidade adequada;
- legibilidade;
- contraste;
- teclado;
- foco;
- labels;
- mensagens de erro;
- loading;
- empty state;
- permission denied;
- responsividade;
- redução de animação;
- consistência de componentes;
- dados mostrados conforme o perfil.

Não altere identidade visual global fora do escopo da fase.
Não priorize aparência sobre integridade e usabilidade.
Crie ou atualize testes E2E e de acessibilidade para os principais fluxos.
```

---

# 29. PROMPT PARA CRIAR DADOS FICTÍCIOS DE DEMONSTRAÇÃO

Use somente quando a fase correspondente já possuir o schema estável.

```text
Crie ou atualize seeds estritamente fictícios para desenvolvimento e testes.

Regras:

- nenhuma pessoa real;
- nenhuma empresa real;
- nomes claramente fictícios;
- documentos marcados como teste;
- CPF/CNPJ somente de teste e não associados a pessoas reais;
- sem dados copiados de produção;
- sem anexos reais;
- seeds idempotentes;
- tenant demo isolado;
- usuários por perfil;
- cenários em diferentes estados;
- documentação sobre como limpar e recriar.

Não execute seed em produção.
Não inclua senha real ou segredo no repositório.
```

---

# 30. PROMPT PARA PREPARAR DEPLOY DE STAGING

```text
Prepare exclusivamente o ambiente de staging.

Não faça deploy de produção.

Verifique:

- projeto correto;
- branch correta;
- variáveis apenas por nome;
- banco separado;
- storage separado;
- dados fictícios;
- domínio de staging;
- RLS;
- migrations;
- backups;
- logs;
- observabilidade;
- rate limiting;
- integrações em sandbox;
- eSocial em ambiente apropriado;
- mensagens sem destinatários reais;
- feature flags;
- acesso restrito.

Após o deploy de staging:

- execute smoke tests;
- E2E crítico;
- autorização;
- isolamento;
- geração documental fictícia;
- fila e chamada;
- rollback de teste quando seguro.

Documente tudo e não promova para produção.
```

---

# 31. CHECKLIST DE PRODUÇÃO — NÃO PULAR

Antes de produção, todos os itens críticos devem estar concluídos:

## Produto e operação

- fluxos validados por usuários reais da clínica;
- recepção;
- triagem;
- profissionais de exames;
- médicos;
- documentação;
- faturamento;
- suporte.

## Clínica

- PCMSO e regras validados;
- protocolos validados;
- formulários validados;
- alertas validados;
- conclusões permitidas validadas;
- bloqueios de ASO validados;
- modelos de documentos validados.

## Jurídico e LGPD

- bases legais;
- avisos de privacidade;
- contratos;
- operadores/suboperadores;
- retenção;
- descarte;
- direitos do titular;
- incidente;
- acesso de empresa;
- assinatura eletrônica.

## Segurança

- pentest;
- RLS;
- IDOR;
- segredo;
- MFA;
- logs;
- upload;
- storage;
- backup;
- restore;
- incident response;
- mínimo privilégio.

## Infraestrutura

- produção separada;
- banco pago adequado;
- PITR;
- backup de Storage;
- alertas;
- monitoramento;
- domínio;
- TLS;
- custo;
- limites;
- rate limiting;
- contingência de internet.

## Qualidade

- lint;
- typecheck;
- unitários;
- integração;
- RLS;
- E2E;
- segurança;
- carga;
- concorrência;
- acessibilidade;
- rollback;
- smoke test.

## Governança

- responsáveis definidos;
- runbooks;
- treinamento;
- suporte;
- janela de mudança;
- plano piloto;
- critérios de interrupção;
- comunicação;
- aceite formal.

---

# 32. CONDIÇÕES QUE DEVEM INTERROMPER AUTOMATICAMENTE UMA FASE

O Codex deve parar e registrar bloqueio se encontrar:

- segredo versionado;
- dado real de paciente;
- dump de produção;
- remote incorreto;
- branch errada;
- alterações locais desconhecidas;
- migration destrutiva sem plano;
- RLS ausente em tabela sensível;
- acesso cruzado entre tenants;
- decisão médica automatizada;
- documento clínico público;
- perda de histórico;
- teste crítico falhando;
- build falhando;
- dependência vulnerável crítica sem mitigação;
- regra médica não validada;
- layout regulatório atual não confirmado;
- integração sem documentação oficial;
- ação de produção não autorizada.

Nesses casos, o Codex deve:

1. interromper;
2. preservar o estado;
3. registrar em `docs/status/OPEN_ISSUES.md`;
4. apresentar evidências;
5. propor opções seguras;
6. aguardar decisão.

---

# 33. DEFINIÇÃO DE PRONTO PARA QUALQUER FEATURE

Uma feature só pode ser considerada pronta quando possui:

- regra documentada;
- autorização server-side;
- RLS quando aplicável;
- validação Zod;
- transação quando necessária;
- idempotência quando necessária;
- auditoria;
- tratamento de erro;
- loading;
- empty state;
- permission denied;
- acessibilidade;
- teste unitário;
- teste de integração;
- teste E2E quando crítica;
- teste negativo;
- observabilidade;
- documentação;
- migration revisada;
- build aprovado;
- nenhum mock oculto;
- dívida técnica registrada;
- critério de rollback.

---

# 34. ORDEM FINAL DE EXECUÇÃO

Use exatamente esta sequência:

```text
Preparação manual
→ Prompt de Inicialização Geral
→ Fase 0
→ Auditoria da Fase 0
→ Correções, se necessárias
→ Commit/PR/Merge da Fase 0
→ Fase 1
→ Auditoria da Fase 1
→ Fase 2
→ Auditoria da Fase 2
→ Fase 3
→ Auditoria da Fase 3
→ Fase 4
→ Auditoria reforçada da Fase 4
→ Fase 5
→ Auditoria da Fase 5
→ Fase 6
→ Auditoria da Fase 6
→ Fase 7A
→ Auditoria
→ Fase 7B
→ Auditoria
→ Fase 7C
→ Auditoria
→ Fase 7D
→ Auditoria
→ Fase 7E
→ Auditoria
→ Fase 7F
→ Auditoria geral da Fase 7
→ Fase 8
→ Auditoria da Fase 8
→ Fase 9
→ Auditoria da Fase 9
→ Fase 10A
→ Auditoria
→ Fase 10B
→ Auditoria
→ Fase 10C
→ Auditoria
→ Fase 10D
→ Auditoria geral da Fase 10
→ Fase 11
→ GO/NO-GO
→ Piloto controlado
→ Correções
→ Nova auditoria
→ Produção somente com autorização formal
```

---

# 35. INSTRUÇÃO FINAL AO CODEX

O Codex deve sempre seguir esta prioridade:

```text
Segurança e integridade
→ isolamento e autorização
→ rastreabilidade e histórico
→ correção funcional
→ testes
→ usabilidade
→ desempenho
→ aparência
→ velocidade de entrega
```

Quando houver conflito entre rapidez e segurança, escolher segurança.

Quando houver conflito entre aparência e integridade clínica, escolher integridade clínica.

Quando houver dúvida médica, jurídica, regulatória ou de LGPD, não inventar. Registrar validação humana obrigatória.

Quando uma fase terminar, parar.

