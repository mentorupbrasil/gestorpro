# Fase atual

- Fase atual: Fase A — autorização por unidade (app)
- Subfase atual: exames / check-in / display com escopo de unidade
- Tarefa atual: dono commitar; próximo bloco técnico sugerido = policies RLS unit-aware em exames
- Feito nesta unidade: helpers `unit-scope.ts`; mutações de exames/check-in/display resolvem unidade no banco; páginas usam `requireTenantOrUnitPermission`
- Branch: `feat/p0-2-consulta-operacional`
- Produção: **NO-GO**
- Atualizado em: 2026-07-13
