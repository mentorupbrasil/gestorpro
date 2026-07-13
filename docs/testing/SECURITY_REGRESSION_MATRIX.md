# Matriz de regressão de segurança

| Cenário                          | Camada       | Evidência esperada         | Estado                               |
| -------------------------------- | ------------ | -------------------------- | ------------------------------------ |
| DML direto em unidade/membership | DB           | permission denied          | migration pronta; DB pendente        |
| RPC crítica em AAL1              | DB           | `42501`                    | migration pronta; DB pendente        |
| permissão de unidade vira tenant | app/DB       | negado                     | unitário verde; DB pendente          |
| último admin bloqueado           | DB           | `42501`                    | migration pronta; DB pendente        |
| autoelevação/papel indevido      | DB           | DML/RPC negado             | contenção pronta                     |
| IDOR documento/atendimento       | app/DB       | recurso carregado e negado | funções prontas; integração pendente |
| usuário bloqueado mantém acesso  | Auth/RLS     | contexto e queries negados | checkpoint antigo; repetir           |
| URL assinada expirada            | storage      | negado e auditado          | futuro I                             |
| segredo no repo/bundle/log       | supply chain | zero achado                | scanner dedicado pendente            |
