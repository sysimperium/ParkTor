-- =============================================================
-- PARKTOR — Patch 1.2.2 Database Migration (Planos) - VERSÃO CORRIGIDA
-- Execute este script no SQL Editor do Supabase para atualizar
-- a estrutura e valores dos planos conforme solicitado.
-- =============================================================

-- 1. Desativar todos os planos existentes para evitar conflitos visuais
UPDATE public.planos SET ativo = false;

-- 2. Inserir a nova estrutura de 4 níveis (Start, Básico, Pro, Enterprise)
-- Esta abordagem evita o erro de "Unique Constraint"
INSERT INTO public.planos (nome, valor, descricao, limite_vagas, ativo)
VALUES 
  ('Start', 99.00, 'Até 20 vagas e 2 usuários', 20, true),
  ('Básico', 199.00, 'Até 50 vagas e 5 usuários', 50, true),
  ('Pro', 299.00, 'Até 100 vagas e 15 usuários', 100, true),
  ('Enterprise', 399.00, 'Vagas e usuários ilimitados', 9999, true);

-- 3. (Opcional) Se você quiser remover os planos antigos desativados:
-- DELETE FROM public.planos WHERE ativo = false;

-- =============================================================
-- MIGRATION CONCLUÍDA
-- =============================================================
