# Fluxo de chamada do paciente

1. Profissional vincula sessão à sala e solicita chamada de ticket elegível.
2. Backend autentica, autoriza, trava/atualiza condicionalmente o ticket e persiste `call_event` + outbox.
3. Após commit, evento mínimo é publicado em canal privado da unidade.
4. Painel exibe nome reduzido ou senha conforme configuração, orienta sala e tenta voz pt-BR.
5. Painel confirma recebimento; ausência gera retry/reconciliação, não nova chamada oficial.
6. Profissional registra comparecimento, início, retorno à fila, redirecionamento ou não comparecimento.

Falha de áudio não impede exibição. Reconexão consulta chamada ativa no banco. Duas salas disputando o mesmo ticket resultam em uma vencedora e conflito explícito para a outra.
