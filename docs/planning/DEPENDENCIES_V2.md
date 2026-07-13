# Dependências V2

```text
A segurança/typegen/integridade
└── B governança/plataforma
    ├── C dados mestres
    │   └── D PCMSO/protocolos
    │       └── E agenda
    │           └── F atendimento/filas
    │               ├── G clínica
    │               └── H exames
    │                   └── I documentos/ASO
    │                       └── J financeiro
    └── K portais depende de C/E/I/J
        └── L integrações depende dos domínios estáveis
            └── N piloto
M SST ampliada depende de B/C e não bloqueia o core.
```

Dependências humanas: clínica (D/G/H/I), jurídico/LGPD (B/I/K/N), contábil (J), regulatória/credenciais (L), segurança/operação (N).
