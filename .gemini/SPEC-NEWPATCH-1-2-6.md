## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## Corrigir a LOGICA da rotatividade
 - Verifique se será preciso alterar ou criar novos campos nas configurações em Valores e Regras

-- Faixas de Rotatividade --

Cada faixa de rotatividade inclue 2Hroras
Sempre os primeiros 5 minutos são de tolerância
Dos 6min aos 20min Acrecimo R$ 3,00
Após o 20Min entra na proxima Faixa

Exemplo: 

O carro entra às 7h
Os primeiro 5min de tolerancia não paga NADA
Das 7:06 ate as 9:05 - R$ 7,00 (após os 5min de tolerância)
Das 9:06 até as 9:20 - R$ 7,00 (da faixa) + R$ 3,00 (acrescimo) = R$ 10,00
Apartir das 9:21 - Proxima faixa

Entrou na proxima Faixa, fica os R$ 7,00 da faixa anterior e reinicia a logica 
Sempre os primeiros 5 minutos são de tolerância
Dos 6min aos 20min Acrecimo R$ 3,00
Após o 20Min entra na proxima Faixa

Continuando o Exemplo, o mesmo carro ainda continua no PATIO
Já tem os R$ 7,00 da primeira faixa
Reinicia a logica:

Das 9:22 ate as 9:27 (os primeiros 5 min - paga apenas R$ 7,00 da faixa + R$ 7,00 da segunda).. se carro saisse agora paga apenas R$ 14,00 (2 faixas de rotatividade)
Das 9:28 ate as 9:48 (acrescimo de R$ 3,00; então ficaria: R$ 14,00 + R$ 3,00 = R$ 17,00)
Apartir das 9:49 - Proxima faixa
Reinicia a lógica