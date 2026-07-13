# GestorPro — Auditoria Funcional, Benchmark e Roadmap Global de Saúde Ocupacional

**Repositório:** `mentorupbrasil/gestorpro`  
**Objetivo:** transformar o GestorPro em uma plataforma completa de saúde ocupacional, segurança do trabalho e saúde corporativa, com capacidade de competir no Brasil e internacionalmente.

---

## 1. REGRA PRINCIPAL DE EXECUÇÃO

Este documento não autoriza implementar tudo de uma vez.

A execução deve ocorrer em fases pequenas, auditáveis e reversíveis. Antes de alterar código:

1. Ler todo este documento.
2. Ler as fontes de verdade existentes em `docs/product`, `docs/status`, `docs/architecture`, `docs/database`, `docs/security`, `docs/permissions`, `docs/workflows`, `docs/testing` e `docs/operations`.
3. Auditar o código atual e diferenciar:
   - funcionalidade somente documentada;
   - modelagem de banco;
   - serviço/domínio;
   - rota/tela existente;
   - fluxo realmente utilizável;
   - fluxo testado ponta a ponta.
4. Não apagar nem substituir funcionalidades existentes sem mapear impacto.
5. Não alterar o site público sem solicitação explícita.
6. Nunca usar dados reais.
7. Não automatizar diagnóstico, aptidão ou decisão clínica final.
8. Toda alteração sensível deve manter auditoria, isolamento por tenant, permissão e versionamento.
9. Após cada unidade de trabalho executar:
   - `pnpm format:check`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
   - testes E2E aplicáveis.
10. Não declarar módulo concluído apenas porque existe rota, tabela ou card.
11. Um módulo somente pode ser considerado operacional quando possuir:
   - tela adequada ao perfil profissional;
   - validações;
   - loading, empty, error e success states;
   - autorização;
   - persistência segura;
   - auditoria;
   - testes;
   - fluxo integrado com as etapas anteriores e posteriores.

---

# 2. DIAGNÓSTICO EXECUTIVO

O GestorPro possui uma fundação técnica promissora, especialmente em:

- arquitetura multi-tenant;
- isolamento e RLS;
- RBAC;
- MFA/AAL2;
- auditoria append-only;
- idempotência;
- outbox;
- snapshots;
- versionamento de dados clínicos;
- documentos imutáveis;
- decisão médica exclusivamente humana;
- separação entre regra clínica e preço comercial.

Entretanto, o produto ainda não pode ser tratado como sistema completo ou pronto para produção.

Problema transversal atual:

> Diversas telas são consoles técnicos ou formulários com JSON bruto. Isso não é adequado para recepcionistas, enfermeiros, médicos, técnicos de exames, laboratório, radiologia, financeiro ou administradores.

A prioridade deve ser transformar a fundação existente em estações de trabalho profissionais, rápidas e integradas.

---

# 3. AUDITORIA DAS TELAS ATUAIS

## 3.1 Recepção e agenda

### Existe

- encaminhamentos;
- empresas;
- trabalhadores;
- recursos;
- agendamentos;
- check-in transacional;
- fila inicial.

### Falta

- agenda visual diária, semanal e mensal;
- filtros por unidade, sala, recurso, empresa, profissional e status;
- encaixe;
- agendamento sem encaminhamento, conforme permissão;
- atendimento sem agendamento;
- bloqueio de agenda;
- recorrência;
- remarcação;
- cancelamento com motivo;
- confirmação;
- falta;
- busca rápida por CPF, nome, matrícula e empresa;
- conferência cadastral;
- documentos e termos pendentes;
- atualização de dados;
- foto;
- impressão de comprovante;
- impressão de etiqueta;
- pendências financeiras;
- pendências clínicas;
- alertas de preparo;
- painel do dia;
- tempo de espera;
- prioridade;
- ocupação por sala.

### Tela alvo

Criar uma bancada de recepção com:

- fila de chegada;
- agendados;
- aguardando;
- chamados;
- em atendimento;
- pendentes;
- concluídos;
- faltosos;
- pesquisa global;
- ações rápidas;
- timeline resumida;
- indicação clara da próxima etapa.

---

## 3.2 Sistema de chamadas

### Existe

- painéis;
- tickets;
- chamada;
- rechamada;
- comparecimento;
- início;
- retorno;
- falta;
- redirecionamento;
- persistência dos eventos.

### Falta

- aplicação pública real para TV;
- autenticação de dispositivo;
- pareamento por código ou QR;
- heartbeat;
- status online/offline;
- Web Speech API;
- configuração de voz;
- nome, senha ou modo de privacidade;
- som antes da chamada;
- histórico de últimas chamadas;
- relógio e identidade visual;
- múltiplas salas e destinos;
- confirmação de recebimento;
- confirmação de exibição;
- reconciliação ao reconectar;
- polling de contingência;
- operação em tela cheia;
- sinalização para profissional quando o painel estiver offline;
- tela operacional de fila por sala;
- chamar próximo;
- impedir duas chamadas concorrentes para o mesmo ticket.

---

## 3.3 Triagem

### Existe

- formulário versionado;
- registro e fechamento;
- estrutura de dados sensíveis;
- MFA para escrita.

### Falta

Substituir JSON por campos clínicos estruturados:

- pressão arterial;
- frequência cardíaca;
- frequência respiratória;
- temperatura;
- saturação;
- peso;
- altura;
- IMC automático;
- circunferência abdominal;
- glicemia;
- escala de dor;
- alergias;
- medicamentos;
- tabagismo;
- etilismo;
- antecedentes;
- queixas;
- gestação, quando aplicável;
- alertas configuráveis;
- observações;
- responsável pela coleta;
- horário;
- equipamentos utilizados;
- impressão;
- histórico comparativo;
- bloqueios clínicos configuráveis sem decisão automática.

Criar tela própria de triagem/enfermagem com fila, botão de chamada e conclusão da etapa.

---

## 3.4 Consultório médico

### Existe

- subjetivo;
- objetivo;
- avaliação;
- plano;
- conclusão médica humana;
- apto;
- apto com restrição;
- inapto;
- inconclusivo.

### Falta

- remover JSON bruto;
- prontuário longitudinal;
- histórico de vínculos;
- riscos e exposições;
- histórico de ASOs;
- exames anteriores;
- comparação de resultados;
- alergias;
- medicamentos;
- antecedentes pessoais e familiares;
- história ocupacional;
- exame físico estruturado;
- anexos;
- achados pendentes;
- resultados críticos;
- restrições anteriores;
- retorno ao trabalho;
- encaminhamento;
- solicitação de exame complementar;
- solicitação de repetição;
- pendência;
- prescrição, quando aplicável;
- declaração;
- parecer;
- assinatura;
- bloqueio de conclusão enquanto etapas obrigatórias estiverem abertas;
- justificativa para exceção;
- revisão e retificação.

Criar visão 360º do trabalhador e consulta em uma única tela de trabalho.

---

## 3.5 Acuidade visual

### Existe

- início do exame;
- versão do resultado;
- equipamento;
- condições;
- conclusão profissional.

### Falta

- formulário visual sem JSON;
- olho direito;
- olho esquerdo;
- binocular;
- perto;
- longe;
- com correção;
- sem correção;
- Snellen;
- Jaeger;
- visão de cores;
- Ishihara;
- estereopsia;
- campo visual;
- observações;
- lentes;
- iluminação;
- distância;
- validação de combinações;
- laudo;
- impressão;
- comparação histórica;
- integração com equipamentos quando disponível.

---

## 3.6 Audiometria

### Existe

- repouso auditivo;
- calibração;
- limiares;
- equipamento;
- cabine;
- conclusão;
- versionamento.

### Falta

- audiograma interativo;
- via aérea;
- via óssea;
- mascaramento;
- frequências completas;
- ouvido direito e esquerdo;
- otoscopia estruturada;
- queixas auditivas;
- exposição a ruído;
- uso de EPI;
- comparação sequencial;
- referência;
- alertas técnicos;
- classificação configurável;
- importação do audiômetro;
- curva gráfica;
- assinatura;
- laudo;
- retificação;
- histórico;
- controle de cabine;
- controle de calibração;
- impedimento de exame com calibração vencida.

---

## 3.7 Espirometria

### Existe

- calibração;
- valores previstos;
- manobras;
- qualidade;
- valores medidos;
- conclusão humana.

### Falta

- remover JSON;
- dados antropométricos estruturados;
- tabagismo;
- contraindicações;
- sintomas;
- medicamentos;
- pré-broncodilatador;
- pós-broncodilatador;
- curva fluxo-volume;
- curva volume-tempo;
- FVC;
- FEV1;
- FEV1/FVC;
- PEF;
- FEF;
- aceitabilidade;
- repetibilidade;
- seleção das melhores manobras;
- comparação histórica;
- integração com equipamento;
- relatório gráfico;
- assinatura;
- controle de calibração;
- bloqueio por calibração vencida;
- motivo de exame inconclusivo.

---

## 3.8 Laboratório

### Existe

- pedidos;
- amostras;
- resultados;
- laboratórios externos;
- sinalização de crítico.

### Falta

- estação de coleta;
- geração e impressão de etiquetas;
- código de barras;
- tipos de tubo;
- material;
- jejum;
- preparo;
- coleta;
- coletador;
- horário;
- cadeia de custódia;
- envio;
- recebimento;
- processamento;
- rejeição;
- motivo de rejeição;
- recoleta;
- aliquotagem;
- analitos;
- unidades;
- valores de referência;
- valores críticos;
- importação de resultados;
- validação técnica;
- validação clínica;
- liberação;
- comunicação de crítico;
- confirmação de leitura;
- anexos;
- laudo;
- integração HL7/FHIR;
- integração com laboratório de apoio;
- histórico de alterações.

---

## 3.9 Radiologia, ECG e EEG

### Existe

- listagem de resultados;
- modalidade;
- status;
- versões.

### Falta

- worklist;
- preparo;
- execução;
- técnico responsável;
- equipamento;
- aquisição;
- anexos;
- upload;
- DICOM;
- DICOMweb;
- PACS;
- viewer;
- ECG com arquivo e traçado;
- EEG com arquivo e laudo;
- teleradiologia;
- laudo estruturado;
- assinatura;
- achado crítico;
- confirmação;
- retificação;
- controle de dose;
- controle de qualidade;
- integração com equipamento;
- entrega segura.

---

## 3.10 Documentos e ASO

### Existe

- templates;
- documentos;
- versões;
- entregas;
- imutabilidade;
- bloqueio de ASO incompleto.

### Falta

- editor de modelos;
- campos dinâmicos;
- mapeamento de dados;
- preview;
- renderização PDF;
- fila de geração;
- assinatura digital;
- assinatura eletrônica;
- certificado ICP-Brasil quando aplicável;
- QR de autenticidade;
- página pública de verificação;
- impressão;
- impressão em lote;
- segunda via;
- retificação;
- cancelamento;
- entrega por portal;
- entrega por e-mail;
- entrega por WhatsApp;
- controle de leitura;
- expiração;
- documentos da empresa;
- documentos do trabalhador;
- ASO;
- ficha clínica;
- laudos;
- declarações;
- recibos;
- relatórios;
- termos.

---

## 3.11 Financeiro

### Existe

- contratos;
- itens faturáveis;
- faturas;
- valores;
- usuários de portal.

### Falta

- tabelas de preço;
- preço por empresa;
- preço por unidade;
- preço por exame;
- pacotes;
- regras de cobrança;
- orçamento;
- aprovação;
- desconto;
- acréscimo;
- contas a receber;
- contas a pagar;
- caixa;
- conciliação;
- boleto;
- PIX;
- cartão;
- NFS-e;
- baixa;
- inadimplência;
- cobrança;
- recorrência;
- centro de custo;
- comissão;
- repasse;
- prestador;
- rentabilidade;
- DRE;
- fluxo de caixa;
- auditoria financeira;
- exportação contábil;
- integração bancária;
- integração com gateway de pagamento.

---

## 3.12 Administração

### Existe

- organizações;
- unidades;
- vínculos;
- papéis;
- status;
- permissões;
- segurança.

### Falta

- convite de usuários;
- criação e edição de papéis;
- editor de permissões;
- escopo por unidade;
- escopo por empresa;
- salas;
- estações;
- dispositivos;
- painéis;
- equipamentos;
- profissionais;
- registros em conselhos;
- feriados;
- horários;
- branding;
- notificações;
- templates;
- filas;
- SLAs;
- auditoria pesquisável;
- retenção;
- consentimentos;
- integrações;
- API keys;
- webhooks;
- planos;
- limites;
- módulos contratados;
- suporte restrito;
- impersonação segura com aprovação e auditoria;
- administração SaaS global.

---

## 3.13 Portal da empresa

Criar aplicação própria para RH e gestores autorizados:

- dashboard;
- trabalhadores;
- vínculos;
- lotação;
- cargos;
- riscos;
- encaminhamentos;
- agendamentos;
- acompanhamento operacional permitido;
- ASOs;
- documentos permitidos;
- convocação de periódicos;
- vencimentos;
- pendências;
- faturas;
- segunda via;
- relatórios;
- importação em massa;
- usuários e permissões;
- centros de custo;
- unidades;
- integração com RH/folha;
- proibição de acesso a prontuário, observações clínicas e resultados restritos.

---

## 3.14 Portal do trabalhador

- cadastro;
- confirmação de identidade;
- agendamento;
- questionários prévios;
- termos;
- preparo;
- check-in;
- senha;
- notificações;
- documentos permitidos;
- ASO;
- vacinas;
- histórico autorizado;
- atualização cadastral;
- privacidade;
- solicitações LGPD;
- suporte.

---

# 4. COMPARAÇÃO COM CONCORRENTES BRASILEIROS

Os requisitos abaixo devem ser tratados como benchmark funcional, não como autorização para copiar código, telas, textos ou propriedade intelectual.

## 4.1 Capacidades comuns em líderes brasileiros

- saúde ocupacional;
- segurança do trabalho;
- eSocial;
- GRO/PGR;
- gestão de riscos;
- EPI;
- EPC;
- CIPA;
- FAP;
- afastamentos;
- absenteísmo;
- CAT;
- PPP;
- LTCAT;
- treinamentos;
- exames;
- audiometria;
- documentos;
- GED;
- assinatura;
- financeiro;
- boletos;
- notas fiscais;
- portal empresarial;
- aplicativos;
- BI;
- rede credenciada;
- integrações com folha, RH, contabilidade e almoxarifado;
- mensagens;
- indicadores;
- auditoria.

## 4.2 Lacunas atuais do GestorPro frente ao Brasil

Prioridade obrigatória:

1. GRO/PGR.
2. Inventário de riscos.
3. GHE.
4. Matrizes de risco.
5. EPI/EPC.
6. CIPA.
7. FAP.
8. Afastamentos.
9. Absenteísmo.
10. CAT.
11. PPP.
12. LTCAT.
13. Insalubridade e periculosidade.
14. AET e ergonomia.
15. Treinamentos.
16. Inspeções.
17. Incidentes.
18. Plano de ação.
19. Rede credenciada.
20. Assinatura digital.
21. Biometria, quando juridicamente validada.
22. Financeiro operacional.
23. eSocial real.
24. Portais.
25. BI.

---

# 5. COMPARAÇÃO COM REFERÊNCIAS MUNDIAIS

## 5.1 Capacidades esperadas internacionalmente

- occupational health;
- employee health;
- medical surveillance;
- population health;
- immunization management;
- mass vaccination campaigns;
- case management;
- injury management;
- restriction management;
- return-to-work;
- fitness-for-duty;
- drug and alcohol testing;
- respirator fit testing;
- travel health;
- expat health;
- workers' compensation;
- claims;
- absence management;
- corporate dashboards;
- integrations with HR, payroll, EHR, labs and insurers;
- multilingual operation;
- multi-currency;
- multi-country;
- country regulatory packs;
- data residency;
- FHIR;
- HL7;
- DICOM;
- open API.

## 5.2 Módulos globais a criar

### Vigilância médica

- grupos de exposição;
- protocolos por exposição;
- exames periódicos;
- periodicidade;
- convocação;
- atraso;
- não conformidade;
- dashboards populacionais.

### Imunizações

- vacinas;
- lotes;
- fabricantes;
- doses;
- esquema;
- contraindicações;
- campanhas;
- consentimento;
- estoque;
- eventos adversos;
- comprovantes.

### Gestão de casos

- caso;
- responsável;
- tarefas;
- restrições;
- contatos;
- documentos;
- prazos;
- retorno ao trabalho;
- desfecho.

### Lesões e incidentes

- incidente;
- lesão;
- mecanismo;
- local;
- gravidade;
- atendimento;
- investigação;
- ações;
- afastamento;
- retorno;
- custos;
- comunicação regulatória.

### Fit-for-duty

- requisitos por função;
- testes físicos;
- avaliações;
- restrições;
- validade;
- decisão humana;
- reavaliação.

### Saúde de viajantes

- destino;
- riscos;
- vacinas;
- exames;
- recomendações;
- documentos;
- validade.

---

# 6. SUÍTE DE SEGURANÇA E ENGENHARIA DO TRABALHO

Criar uma plataforma EHS/SST completa.

## 6.1 GRO e PGR

- inventário de riscos;
- unidades;
- setores;
- cargos;
- atividades;
- GHE;
- perigos;
- fontes;
- vias;
- consequências;
- medidas existentes;
- probabilidade;
- severidade;
- nível;
- aceitabilidade;
- plano de ação;
- responsáveis;
- prazos;
- evidências;
- revisão;
- versionamento;
- aprovação.

## 6.2 Higiene ocupacional

- agentes;
- metodologias;
- equipamentos;
- calibração;
- amostragem;
- grupos;
- resultados;
- limites;
- anexos;
- laudos;
- cronograma;
- histórico;
- integração com PGR.

## 6.3 EPI/EPC

- catálogo;
- CA;
- validade;
- estoque;
- tamanho;
- entrega;
- devolução;
- substituição;
- higienização;
- treinamento;
- assinatura;
- biometria opcional;
- ficha;
- custo;
- rastreabilidade.

## 6.4 CIPA

- dimensionamento;
- processo eleitoral;
- candidatos;
- votos;
- atas;
- reuniões;
- mandato;
- treinamento;
- plano de trabalho;
- inspeções;
- ações.

## 6.5 Incidentes e acidentes

- incidente;
- quase acidente;
- acidente;
- CAT;
- envolvidos;
- testemunhas;
- fotos;
- local;
- causas;
- árvore de causas;
- 5 porquês;
- plano de ação;
- comunicação;
- investigação;
- aprovação;
- indicadores.

## 6.6 Treinamentos

- matriz por cargo;
- curso;
- norma;
- instrutor;
- turma;
- presença;
- avaliação;
- certificado;
- vencimento;
- convocação;
- reciclagem;
- integração com terceiros.

## 6.7 Ergonomia

- AEP;
- AET;
- checklist;
- posto;
- atividade;
- riscos;
- fotos;
- recomendações;
- plano;
- acompanhamento.

## 6.8 Documentos legais

- PGR;
- PCMSO;
- LTCAT;
- PPP;
- laudo de insalubridade;
- laudo de periculosidade;
- AET;
- relatórios;
- versões;
- assinaturas;
- validade;
- evidências.

---

# 7. ESOCIAL

Implementar ciclo completo e auditável:

- S-2210;
- S-2220;
- S-2240;
- geração;
- validação;
- certificado;
- assinatura;
- lote;
- transmissão;
- recibo;
- protocolo;
- consulta;
- erro;
- retificação;
- exclusão;
- reprocessamento;
- produção restrita;
- produção;
- layouts e versões;
- comparação entre dado interno e enviado;
- painel de pendências;
- prazos;
- alertas;
- integração com folha;
- logs redigidos;
- idempotência;
- dead-letter;
- proibição de envio real sem autorização formal.

---

# 8. INTEROPERABILIDADE

Planejar e implementar progressivamente:

- HL7 FHIR;
- HL7 v2;
- LOINC;
- SNOMED CT;
- CID-10;
- CID-11 preparado;
- TUSS quando aplicável;
- DICOM;
- DICOMweb;
- PACS;
- OpenAPI;
- webhooks;
- OAuth;
- SSO;
- SCIM;
- importação CSV/XLSX;
- exportação segura;
- integração com RH;
- folha;
- contabilidade;
- laboratórios;
- equipamentos;
- seguradoras;
- rede credenciada.

---

# 9. CONECTOR LOCAL DE EQUIPAMENTOS

Criar um produto separado chamado provisoriamente `GestorPro Device Connector`.

Requisitos:

- instalação local;
- autenticação do dispositivo;
- pareamento;
- fila offline;
- criptografia;
- sincronização;
- retries;
- idempotência;
- logs;
- atualização segura;
- leitura de pasta;
- importação de arquivos;
- impressão silenciosa autorizada;
- leitor de código de barras;
- integração com audiômetros;
- espirômetros;
- ECG;
- EEG;
- equipamentos laboratoriais;
- balança;
- estadiômetro;
- pressão;
- câmera;
- biometria;
- assinatura;
- certificados;
- arquitetura de plugins por fabricante.

---

# 10. SEGURANÇA, PRIVACIDADE E CONFORMIDADE

Não liberar produção sem:

- RLS validada em banco real;
- testes negativos tenant A/B;
- autorização por unidade;
- autorização por empresa;
- MFA;
- sessões;
- logs;
- auditoria de leitura;
- break-glass;
- consentimentos;
- bases legais;
- retenção;
- descarte;
- anonimização;
- exportação;
- legal hold;
- criptografia;
- gestão de segredos;
- rotação;
- SAST;
- DAST;
- dependency scan;
- secret scan;
- SBOM;
- backup;
- restore;
- disaster recovery;
- RPO;
- RTO;
- pentest externo;
- incident response;
- monitoramento;
- alertas;
- revisão LGPD;
- avaliação SBIS/CFM;
- preparação ISO 27001;
- preparação ISO 27701;
- preparação SOC 2;
- HIPAA e GDPR apenas quando houver escopo internacional validado.

Usar OWASP ASVS como referência de verificação.

---

# 11. ACESSIBILIDADE E EXPERIÊNCIA

Meta mínima: WCAG 2.2 AA.

Obrigatório:

- teclado;
- foco;
- contraste;
- labels;
- mensagens de erro;
- prevenção de erros;
- confirmação de ações críticas;
- leitores de tela;
- tabelas acessíveis;
- responsividade;
- estados de loading;
- empty;
- error;
- offline;
- retry;
- skeleton;
- atalhos operacionais;
- densidade adequada;
- sem excesso de cards;
- sem JSON bruto para usuários finais;
- linguagem em português claro;
- internacionalização preparada.

---

# 12. DIFERENCIAIS ESTRATÉGICOS

## 12.1 Trabalhador 360º

Criar linha do tempo única:

- vínculos;
- cargos;
- riscos;
- exames;
- atendimentos;
- resultados;
- ASOs;
- restrições;
- afastamentos;
- vacinas;
- incidentes;
- EPI;
- treinamentos;
- documentos;
- comunicações.

## 12.2 Empresa 360º

- estrutura;
- trabalhadores;
- GHE;
- riscos;
- PCMSO;
- PGR;
- vencimentos;
- eSocial;
- absenteísmo;
- FAP;
- acidentes;
- treinamentos;
- EPI;
- custos;
- epidemiologia;
- unidades;
- indicadores.

## 12.3 GestorPro Flow

Construtor no-code de fluxos:

- gatilhos;
- condições;
- etapas;
- responsáveis;
- SLAs;
- formulários;
- aprovações;
- notificações;
- ações;
- versionamento;
- simulação;
- rollback.

## 12.4 GestorPro Intelligence

IA assistiva, nunca decisória:

- resumo;
- transcrição;
- estruturação;
- campos faltantes;
- inconsistências;
- comparação histórica;
- rascunho;
- explicação;
- revisão humana;
- trilha de auditoria;
- modelo e versão registrados;
- sem aptidão automática;
- sem diagnóstico automático.

## 12.5 Centro de comando

- filas;
- espera;
- atrasos;
- salas;
- capacidade;
- críticos;
- ASOs bloqueados;
- equipamentos offline;
- chamadas não entregues;
- faturamento;
- pendências;
- SLAs;
- alertas.

---

# 13. ROADMAP OBRIGATÓRIO

## P0 — Produto clínico operacional

1. Reauditar a base.
2. Criar matriz real de módulos e telas.
3. Remover JSON das telas.
4. Criar recepção completa.
5. Criar triagem completa.
6. Criar consultório completo.
7. Criar Trabalhador 360º.
8. Concluir chamadas e TV.
9. Concluir acuidade.
10. Concluir audiometria.
11. Concluir espirometria.
12. Concluir laboratório.
13. Concluir radiologia/ECG/EEG.
14. Concluir documentos e ASO.
15. Concluir financeiro.
16. Criar portal empresarial.
17. E2E integral.
18. Segurança, backup, carga, acessibilidade e pentest.

## P1 — Liderança brasileira

1. eSocial.
2. GRO/PGR.
3. riscos.
4. EPI/EPC.
5. CIPA.
6. FAP.
7. afastamentos.
8. absenteísmo.
9. CAT.
10. PPP.
11. LTCAT.
12. ergonomia.
13. incidentes.
14. treinamentos.
15. rede credenciada.
16. BI.
17. assinatura.
18. aplicativo/PWA.

## P2 — Plataforma internacional

1. vigilância médica;
2. imunizações;
3. campanhas;
4. case management;
5. injury management;
6. restrições;
7. retorno ao trabalho;
8. fit-for-duty;
9. drug and alcohol;
10. travel health;
11. FHIR;
12. HL7;
13. DICOM;
14. multilíngue;
15. multimoeda;
16. multipaís;
17. data residency;
18. pacotes regulatórios.

## P3 — Vantagem competitiva

1. GestorPro Flow;
2. GestorPro Intelligence;
3. marketplace;
4. conector universal;
5. benchmarking anonimizado;
6. previsão de capacidade;
7. automações;
8. analytics avançado.

---

# 14. ENTREGÁVEIS QUE O CURSOR DEVE CRIAR ANTES DE PROGRAMAR

Criar ou atualizar:

- `docs/product/GESTORPRO_AUDITORIA_FUNCIONAL_GLOBAL.md`
- `docs/product/GESTORPRO_BENCHMARK_BRASIL_E_MUNDO.md`
- `docs/product/GESTORPRO_TARGET_OPERATING_MODEL.md`
- `docs/planning/GESTORPRO_ROADMAP_P0_P3.md`
- `docs/planning/GESTORPRO_BACKLOG_MASTER.md`
- `docs/planning/GESTORPRO_MODULE_MATRIX.md`
- `docs/planning/GESTORPRO_SCREEN_INVENTORY.md`
- `docs/planning/GESTORPRO_INTEGRATION_ROADMAP.md`
- `docs/planning/GESTORPRO_SECURITY_GO_LIVE_GATES.md`
- `docs/status/GESTORPRO_EXECUTION_STATUS.md`

A matriz de módulos deve conter:

- módulo;
- submódulo;
- perfil;
- rota;
- banco;
- domínio;
- tela;
- ações;
- permissões;
- auditoria;
- testes;
- integração anterior;
- integração posterior;
- status real;
- lacunas;
- prioridade;
- critério de aceite.

---

# 15. PADRÃO DE EXECUÇÃO DE CADA FASE

Para cada unidade:

1. Criar plano em `docs/implementation/`.
2. Mapear arquivos afetados.
3. Mapear migrations.
4. Mapear permissões.
5. Definir critérios de aceite.
6. Implementar.
7. Criar testes unitários.
8. Criar testes de integração.
9. Criar E2E.
10. Atualizar documentação.
11. Atualizar status.
12. Executar gates.
13. Não avançar se houver erro.
14. Não marcar concluído sem evidência.

---

# 16. PRIMEIRA TAREFA DO CURSOR

Não implementar todos os módulos agora.

Executar somente:

## Fase P0.0 — Auditoria real e consolidação

1. Ler o repositório completo.
2. Validar este documento contra o código atual.
3. Identificar funcionalidades que já foram concluídas depois desta auditoria.
4. Classificar cada item como:
   - inexistente;
   - documentado;
   - modelado;
   - backend parcial;
   - tela somente leitura;
   - console técnico;
   - operacional parcial;
   - operacional;
   - testado E2E;
   - pronto para piloto;
   - pronto para produção.
5. Criar todos os documentos da seção 14.
6. Criar backlog P0–P3.
7. Quebrar P0 em unidades pequenas.
8. Definir dependências.
9. Definir riscos.
10. Definir critérios de aceite.
11. Executar gates atuais sem alterar comportamento.
12. Entregar relatório final da Fase P0.0.
13. Não iniciar P0.1 sem registrar claramente a próxima unidade recomendada.

---

# 17. DEFINIÇÃO DE PRONTO

Nenhum módulo pode receber status `DONE` apenas por possuir tabelas ou uma rota.

Status possíveis:

- `NOT_STARTED`
- `DOCUMENTED_ONLY`
- `SCHEMA_ONLY`
- `BACKEND_PARTIAL`
- `READ_ONLY_UI`
- `TECHNICAL_CONSOLE`
- `OPERATIONAL_PARTIAL`
- `OPERATIONAL`
- `E2E_VALIDATED`
- `PILOT_READY`
- `PRODUCTION_READY`

`PRODUCTION_READY` exige:

- fluxo completo;
- segurança;
- auditoria;
- testes;
- acessibilidade;
- desempenho;
- backup;
- restore;
- observabilidade;
- validação humana;
- documentação;
- suporte;
- plano de incidente.
