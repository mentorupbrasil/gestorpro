# ADR-0001 — Monólito modular

**Status:** PROPOSTA

## Decisão

Iniciar com uma aplicação Next.js e pacotes/módulos internos com dependências direcionadas. Não adotar microserviços no MVP.

## Consequências

Menor custo operacional, transações locais e entrega incremental. Exige disciplina de fronteiras; módulos poderão ser extraídos apenas com evidência de necessidade.
