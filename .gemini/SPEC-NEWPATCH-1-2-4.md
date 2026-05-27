## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## No usuario root, no sidebar só deve ter apenas as opções: Tentants, Planos, Relatorios (em desenvolvimento) e Painel Root (em desenvolvimento), mas ao clicar em Planos o SIDEBAR está mudando e aparecendo DASHBOARD, NOVA ENTRADA, REGISTRAR SAIDA, FINANANCEIRO, RELATORIOS, MENSALISTAS E CONFIGURAÇÕES

## O perfil "operador" no sidebar, sódeve ter apenas: Registrar Saida

## No perfil "ADMIN", no mobilen em daszhboard geral, ao tentar acessar o sidebar, nada acontece.

## Vamos alterar o historico de cobrança (em registrar saida):

--Crie um cabeçalho:

 -- Faixas de Rotatividade --

Em vez de "Bloco [x]" ou "1º Bloco" vamos usar

1ª. Faixa 2h
2ª. Faixa 2h
3ª. Faixa 2h
4ª. Faixa 2h
5ª. Faixa 2h
6ª. Faixa 2h

--No final antes do total uma sinalização de quantas faixas de rotatividade foram usadas, por exemplo:

Faixas Rotatividades utilizadas (2)

--Lembrando que os valores e as regras são:
- A tabela de preços deve ficar assim:
-- Até duas horas -> 7 reais
-- Após duas horas (tolerancia de até 20 minutos) -> 3 reais excedente
-- Passou dos 20 minutos -> Proxima faixa de rotatividade (7 reais por mais duas horas)


## Ao registar saida, quando o historico de saida está ficando muito grande não está permitindo "rolar" a pagina ate o botão verde finalizar saida (nas duas versões: celular (mobile) e PC)