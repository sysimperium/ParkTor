## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## Corrigir a LOGICA da rotatividade
 - Verifique se será preciso alterar ou criar novos campos nas configurações em Valores e Regras

-- Faixas de Rotatividade --
Cada faixa 2hr - R$ 7,00

Exemplo:

O carro entra às 7:00

 - Os primeiros 5min não paga (5min de tolerância)

 - Após os 5min ou seja, das 7:06 às 9:05 o cliente paga o valor da faixa, R$ 7,00

 - Das 9:06 as 9:20 um acréscimo de R$ 3,00 por não tirar o carro (R$ 7,00 da faixa + R$ 3,00 de excedente)

 - Apartir das 9:21, já está na próxima faixa +R$ 7,00

Apartir da próxima faixa (segunda faixa) o sistema vai se comportar da seguinte maneira:

Vai cobrar os R$ 7,00 da primeira faixa utilizada + R$ 7,00 da segunda faixa = R$ 14,00

A segunda faixa de rotatividade, vai das 9:21 até às 11:21

No final da segunda faixa, têm 5min de tolerância, só paga R$ 14,00 que vai das 11:22 até às 11:27 (paga R$ 14,00)

Das 11:28 até às 11:48 + R$ 3,00 do excedente... Total R$ 14,00 (da primeira e segunda faixa) + R$ 3,00 = R$ 17,00

11:49 entra na terceira faixa

A terceira faixa de rotatividade, vai das 11:49 até às 13:49

No final da terceira faixa, têm 5min de tolerância, só paga R$ 21,00 que vai das 13:49 até às 13:54 (paga R$ 21,00)

Das 13:55 até às 14:15 + R$ 3,00 excedente... Total R$ 21,00 (da primeira, segunda e terceira faixa) + R$ 3,00 = R$ 24,00

14:16 entra na quarta faixa de rotatividade 

A quarta faixa de rotatividade, vai das 14:16 até às 16:16

No final da quarta faixa, têm 5min de tolerância, só paga R$ 28,00 que vai das 16:16 até às 16:21 (paga R$ 28,00)

Das 16:22 até às 16:42 + R$ 3,00 excedente... Total R$ 28,00 (da primeira, segunda, terceira e quarta faixa de rotatividade) + R$ 3,00 = R$ 31,00

16:43 entra na quinta faixa de rotatividade 

É assim por diante, até o carro ser retirado