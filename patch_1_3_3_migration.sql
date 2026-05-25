-- MIGRATION: SISTEMA DE NOTIFICAÇÃO DE PAGAMENTO (PATCH 1.3.3)

-- 1. Adicionar coluna para rastrear quando o pagamento foi informado
ALTER TABLE public.platform_invoices 
ADD COLUMN IF NOT EXISTS notificado_em TIMESTAMPTZ;

-- 2. Garantir que o status possa ser 'em_analise'
-- Se houver uma constraint de check, ela deve ser atualizada. 
-- Como estamos usando texto simples no JS, apenas documentamos que 'em_analise' é um status válido.

-- Nota: O administrador (Admin) poderá atualizar o status para 'em_analise'
-- O Root poderá atualizar de 'em_analise' para 'pago'.
