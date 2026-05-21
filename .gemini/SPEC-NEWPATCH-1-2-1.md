## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## Ajustes no "Valores e Regras" (Configurações):
- A tabela de preços deve ficar assim:
-- Até duas horas -> 7 reais
-- Após duas horas (tolerancia de até 20 minutos) -> 3 reais excedente
-- Passou dos 20 minutos -> Proxima faixa de rotatividade (7 reais por mais duas horas)

- Exemplo de entrada as 12H00:
-- Saiu as 14H00 -> 7 reais;
-- Tolerância (até 14H20) -> 10 reais (+3 reais do excedente);
-- Saiu de 14H21 em diante -> 14 Reais (+7 reais da proxima faixa);
-- Saiu as 16H00 -> 14 reais;
-- Tolerância (até 16H20) -> 17 reais (+3 reais do excedente);
-- E assim por diante...

## Ajuste no menu lateral do ADMIN:
- No sidebar não tem a necessidade de ter os botões "Nova Entrada" e "Registrar saida"

## Ajueste e Nova funcionalidade na tela de configurações:
- No input "Total de vagas" deve ser limitado com base no plano adquirido do Estacionamento (Com base no plano atrelado no momento que o root criou), se plano é limitado a 20 vagas, ele não pode atualizar as informações se o usuário colocar 30, por exemplo.
- Ao alterar o número de vagas, no dashboard tem que mostrar a quantidade correta.

## Nova pagina (Mensalistas):
- Crie apenas o arquivo e adiciono no sidebar, ná pagina coloque o placeholder "Em Desenvolvimento." seguindo o padrão de UI do sistema.