# Geração documental

Templates e variáveis são versionados. A aplicação valida pré-condições, registra uma solicitação idempotente e confirma a transação; workflow gera PDF determinístico, calcula hash, grava objeto privado e cria versão imutável.

```mermaid
sequenceDiagram
  participant U as Usuário autorizado
  participant A as Aplicação
  participant D as Banco
  participant W as Workflow
  participant S as Storage privado
  U->>A: Solicitar geração
  A->>D: Validar + registrar pedido/outbox
  D-->>A: Commit
  W->>D: Reservar pedido idempotente
  W->>S: Gravar objeto opaco
  W->>D: Hash + versão + estado
```

Documento emitido nunca é sobrescrito. Retificação cria nova versão e preserva vínculo/hashes anteriores. Downloads exigem autorização, URL temporária e auditoria. ASO depende de conclusão médica humana válida e ausência de pendências obrigatórias.
