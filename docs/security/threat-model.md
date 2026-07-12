# Threat model inicial

| Ameaça                       | Impacto    | Controle planejado                                | Teste                      |
| ---------------------------- | ---------- | ------------------------------------------------- | -------------------------- |
| IDOR/tenant cruzado          | crítico    | contexto server-side + query escopada + RLS       | tenant A/B                 |
| Elevação de privilégio       | crítico    | RBAC granular, escopos, MFA/AAL                   | papel insuficiente         |
| Documento público/URL vazada | crítico    | bucket privado, URL curta, auditoria              | URL expirada/tenant errado |
| Injeção/XSS                  | alto       | Zod, queries parametrizadas, escaping, CSP        | payload malicioso          |
| CSRF/replay                  | alto       | cookies seguros, origem, nonce/idempotência       | replay de mutação          |
| Duplo check-in/chamada       | alto       | unique, lock/transação, versão                    | concorrência real          |
| Segredo no cliente/log       | crítico    | boundary server-only, scanner e redaction         | bundle/log scan            |
| Upload malicioso             | alto       | tipo/tamanho, quarentena, scan e chave opaca      | arquivo inválido           |
| Alteração histórica          | crítico    | append/version, FK restritiva e auditoria         | update/delete negado       |
| Indisponibilidade externa    | médio/alto | outbox, retry, circuit breaker, reconciliação     | falha injetada             |
| Abuso interno                | alto       | mínimo privilégio, auditoria de leitura e alertas | acesso emergencial         |

Riscos jurídicos, clínicos, de retenção, assinatura e incidentes dependem de validação humana antes de produção.
