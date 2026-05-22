-- =============================================================
-- PARKTOR — Patch 1.2.2 Database Migration (Planos)
-- Execute este script no SQL Editor do Supabase para atualizar
-- a estrutura e valores dos planos conforme solicitado.
-- =============================================================

-- 1. Limpar planos antigos (ou desativar)
UPDATE public.planos SET ativo = false;

-- 2. Inserir ou Atualizar a nova estrutura de 4 níveis
-- Nota: Usamos ON CONFLICT se houver uma chave única por nome, 
-- caso contrário, inserimos os novos e garantimos que os IDs sejam consistentes.

INSERT INTO public.planos (nome, valor, descricao, limite_vagas, ativo)
VALUES 
  ('Start', 99.00, 'Até 20 vagas e 2 usuários', 20, true),
  ('Básico', 199.00, 'Até 50 vagas e 5 usuários', 50, true),
  ('Pro', 299.00, 'Até 100 vagas e 15 usuários', 100, true),
  ('Enterprise', 399.00, 'Vagas e usuários ilimitados', 9999, true)
ON CONFLICT (nome) DO UPDATE SET 
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao,
  limite_vagas = EXCLUDED.limite_vagas,
  ativo = true;

-- =============================================================
-- MIGRATION CONCLUÍDA
-- =============================================================
