# Matriz de segurança clínica

| Risco                             | Regra segura                        | Gate  |
| --------------------------------- | ----------------------------------- | ----- |
| protocolo ausente/PCMSO vencido   | bloquear e abrir exceção            | D/F   |
| recepção concluir ASO             | negar por papel/recurso/AAL2        | G/I   |
| técnico editar exame incompatível | exigir habilitação/ordem            | H     |
| equipamento vencido               | bloquear ou exceção formal validada | H     |
| resultado crítico não reconhecido | impedir conclusão                   | G/H/I |
| documento sobrescrito             | versão/retificação imutável         | I     |
| decisão por IA                    | proibida; revisão humana            | todos |
| workflow repetido                 | idempotência sem duplicação         | F/I/L |

Nenhuma regra clínica específica será inventada para satisfazer teste.
