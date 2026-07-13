# Matriz de multitenancy

| Origem → alvo                     | Autorização                 | RLS                      | Integridade         | Estado                  |
| --------------------------------- | --------------------------- | ------------------------ | ------------------- | ----------------------- |
| tenant A → tenant B               | negar                       | negar                    | FK composta         | integridade pendente    |
| unidade A → unidade B             | `requireUnitPermission`     | `has_unit_permission`    | FK tenant/unidade   | app pronto; DB pendente |
| empresa A → empresa B             | `has_company_permission`    | policy de recurso futura | FK tenant/empresa   | parcial                 |
| profissional → sala não atribuída | função profissional/unidade | policy futura            | assignment composto | pendente                |
| empresa → prontuário              | negar por finalidade        | negar                    | N/A                 | teste futuro G/K        |
| financeiro → anamnese             | negar                       | negar                    | N/A                 | teste futuro G/J        |
| suporte → clínico                 | break-glass somente         | negar padrão             | N/A                 | pendente                |
