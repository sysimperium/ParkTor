## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## No registro de saida preciso que conste um historico da faixa de rotatividade que o veiculo USOU no qual foi gerado o valor do pagamento

- Exemplos:
O carro entrou as 12:00
E saiu as 14:30

No historico deve constar:

Faixa de rotatividade utilizada:

Das 12:00 ás 14:20 (incluindo os 20min de tolerância)
 - 2Hr -> R$ 7,00
Das 14:20 às 14:30
Excedente R$ 3,00
Totalizando R$ 10,00

Outro Exemplo
 - O carro entrou as 8:00
E saiu as 14:40

No historico deve constar:

Faixa de rotatividade utilizada:

Das 8:00 ás 10:20 (incluindo os 20min de tolerância)
 - 2Hr - 7,00
Das 10:20 ás 12:20 (incluindo os 20min de tolerância)
 - 2Hr - 7,00
Das 12:20 ás 14:20 (incluindo os 20min de tolerância)
 - 2Hr - 7,00
Das 14:20 às 14:40
Excedente 3,00
Totalizando R$ 24,00


## Ajustes no "Valores e Regras" (Configurações):
- A tabela de preços deve ficar assim:
-- Até duas horas -> 7 reais
-- Após duas horas (tolerancia de até 20 minutos) -> 3 reais excedente
-- Passou dos 20 minutos -> Proxima faixa de rotatividade (7 reais por mais duas horas)


## Ajueste e Nova funcionalidade na tela de configurações:
- No input "Total de vagas" deve ser limitado com base no plano adquirido do Estacionamento (Com base no plano atrelado no momento que o root criou), se plano é limitado a 20 vagas, ele não pode atualizar as informações se o usuário colocar 30, por exemplo.
- Com base no número de vagas, a Entrada efetuada pelo manobrista, não pode permitir a entrada de mais carros do que o configurado, pois é a quantiade de vagas do estacionamento. só será liberado quando sair um carro, e no dashboard em "No Patio" o maximo é conforme o informado nas configurações e não pode PERMII

## Nova pagina (Mensalistas):
- Crie apenas o arquivo e adiciono no sidebar, ná pagina coloque o placeholder "Em Desenvolvimento." seguindo o padrão de UI do sistema.

## Na tela de entrada não precisa mostar os carros que já sairam, mas essa informação dos carros que sairam, deve permenacer na tela da saida (crie uma guia que mostre como histórico, por data - confio na sua criatividade)

## O financeiro está ficando em BRANCO quando acessamos 