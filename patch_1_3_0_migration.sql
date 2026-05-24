-- Patch 1.3.0 - Conferência de Caixa
-- Adiciona campos para armazenar valores informados e calculados pelo sistema no fechamento

ALTER TABLE public.cashier_sessions 
ADD COLUMN IF NOT EXISTS valor_informado_dinheiro DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_informado_pix DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_informado_cartao DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_sistema_dinheiro DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_sistema_pix DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS valor_sistema_cartao DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.cashier_sessions.valor_informado_dinheiro IS 'Valor em dinheiro informado pelo operador no fechamento';
COMMENT ON COLUMN public.cashier_sessions.valor_informado_pix IS 'Valor em PIX informado pelo operador no fechamento';
COMMENT ON COLUMN public.cashier_sessions.valor_informado_cartao IS 'Valor em Cartão informado pelo operador no fechamento';
COMMENT ON COLUMN public.cashier_sessions.valor_sistema_dinheiro IS 'Total em dinheiro registrado pelo sistema para esta sessão';
COMMENT ON COLUMN public.cashier_sessions.valor_sistema_pix IS 'Total em PIX registrado pelo sistema para esta sessão';
COMMENT ON COLUMN public.cashier_sessions.valor_sistema_cartao IS 'Total em Cartão registrado pelo sistema para esta sessão';
