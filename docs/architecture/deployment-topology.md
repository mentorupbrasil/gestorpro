# Topologia de ambientes e deploy

Ambientes local, test, preview, staging e production são isolados em banco, Storage, segredos e integrações. Preview e staging usam somente dados fictícios. Região preferencial: aplicação e Supabase próximos a São Paulo, sujeita a validação de disponibilidade/custo na Fase 1.

O pipeline pretendido é PR → formatação → lint → typecheck → unitários → integração/RLS/migrations → build → preview → E2E. Produção exige aprovação humana, checklist de segurança, backup/restauração e piloto; não será acionada automaticamente.
