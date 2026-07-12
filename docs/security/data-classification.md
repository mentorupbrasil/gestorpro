# Classificação de dados

| Classe               | Exemplos                                       | Regras mínimas                                                          |
| -------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| Pública              | conteúdo institucional aprovado                | publicação explícita                                                    |
| Interna              | configurações não secretas, métricas agregadas | autenticação e mínimo privilégio                                        |
| Confidencial pessoal | contato, CPF, vínculo                          | criptografia, mascaramento, escopo e auditoria                          |
| Sensível de saúde    | triagem, exames, consulta, ASO                 | acesso clínico estrito, Storage privado, auditoria de leitura, sem logs |
| Segredo              | tokens, service role, certificados             | cofre, rotação, nunca Git/browser/log                                   |

Retenção, base legal, direitos do titular, anonimização e descarte dependem de parecer LGPD. Ambientes não produtivos usam somente dados sintéticos claramente fictícios.
