# Plano de releases

- previews: dados fictícios, branch/PR, sem integrações reais;
- staging: banco/storage separados, migrations validadas, sandbox e acesso restrito;
- piloto: somente após gate N, homologação, treinamento, contingência e autorização formal;
- produção: aprovação humana, ambientes protegidos, backup/restore, janela, smoke test e rollback.

Não há release autorizada nesta Fase A. A branch atual não deve ser mesclada na `main`.
