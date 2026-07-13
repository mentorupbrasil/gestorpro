# Ações humanas obrigatórias (não automatizar)

Estas ações ficam fora do agente de código. Sem elas a decisão permanece **NO-GO**.

## Segurança / exposição

1. Confirmar se o repositório está **privado** no GitHub (screenshot local recente ainda pode mostrar Public).
2. Revogar e recriar `SUPABASE_ACCESS_TOKEN` se já foi exposto.
3. Revisar variáveis Production / Preview / Development na Vercel.
4. Revisar chaves Supabase, webhooks, deploy keys e GitHub Apps.

## Proteção da `main` (Settings → Branches → Branch protection)

Ativar manualmente:

- exigir PR (sem push direto);
- PR não draft para merge;
- status checks obrigatórios: CI quality, CodeQL, Dependency Review;
- branch atualizada antes do merge;
- conversas resolvidas;
- ≥1 revisão humana;
- bloquear force push e exclusão da `main`.

Ambiente Production: aprovação manual antes de deploy.

## Não misturar com implementação

Rotação de token / Vercel / branch protection **não** bloqueiam continuar código da Fase A na feature branch; bloqueiam apenas qualquer GO de produção.
