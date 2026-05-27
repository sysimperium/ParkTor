## Ajustes necessarios para o sistema
- Segue as anotações do que deve ser feito no sistema para conclusão da aplicação. Lembrando que deve seguir as normas de commit presentes no arquivo `.gemini/SPEC-GIT-WORKFLOW.md`. Não tem a necessidade de enviar para o github a cada alteração (executar o `git push`), commit tudo e ao final das changes, envie para o repositorio remoto.

## Planos (limites de criação de usuarios)
-- No PERFIL ROOT:

 - Plano Start
O ADMIN, não "conta" como usuario, ou seja, o ADMIN poderá criar mais dois usuarios (limitados em 1 manobrista e 1 operador), só será possivel criar um de cada, caso tente criar mais, o sistema não irá permitir, e aparecerá um aviso informando que o plano só permite 1 manobrista e 1 operador, se precisar de mais funcionario será preciso um UPDATE de Plano

 - Plano Basico
O ADMIN, "conta" como usuario, como o plano basico permite 5 usuario, o ADMIN consegue criar 2 operadores e 2 manobristas e com o ADMIN fecha o total 5 Usuarios (é bloqieado para criar mais do que esses, aparecendo um aviso da necessidade de UPDATE)

 - Plano Pro
O ADMIN, "conta" como usuario, e apartir desse plano (plano pro) não limite de funções podem ser criados dentro do limite de 15 usuario, quantos manobristas e operadores forem precisos (só não pode criar ADMIN)

 - Plano Enterprise
O ADMIN, "conta" como usuario podem ser criados usuarios livremente (exceto ADMIN)