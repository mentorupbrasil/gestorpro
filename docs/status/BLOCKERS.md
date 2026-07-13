# Bloqueios

## Produção / merge

- Produção e merge na `main`: **NO-GO** (regra permanente até GO humano).
- Não tratar rotação de token/Vercel como bloqueio de implementação.

## P0.5 - proteção administrativa

- Código e testes unitários de schema entregues (2026-07-13).
- Migration `202607140010_p0_5_admin_role_protection.sql` **ainda não aplicada** no Supabase autorizado nesta sessão.
- Break-glass clínico completo permanece documental (`docs/security/BREAK_GLASS.md`) - decisão LGPD humana.

## P0.6 - auditoria de leitura sensível

- Código no repo (migration `202607140011`, helper `sensitive-read.ts`, wiring consulta/documentos) entregue (2026-07-13).
- Apply no Supabase autorizado **ainda pendente**.

## P0.4 - integridade composta

- Ondas 1-3 (`007`-`009`) aplicadas no ambiente autorizado (dono).
- Onda 4+ (PCMSO/protocolos/resultados/document versions) ainda não migrada.

## Já resolvido (não reabrir)

- P0.1-P0.3 MFA/checklists operacionais
- Typegen oficial + fingerprint LF-safe + CI feature
- Repo privado + PR draft #11
