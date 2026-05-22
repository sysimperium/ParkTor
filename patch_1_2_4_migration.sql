-- =============================================================
-- PARKTOR — Patch 1.2.4 Database Migration (Configurações Financeiras)
-- =============================================================

-- 1. ADICIONAR COLUNAS DE CONFIGURAÇÃO NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10,2) DEFAULT 40.00,
ADD COLUMN IF NOT EXISTS custo_fixo_mensal DECIMAL(10,2) DEFAULT 0.00;

-- 2. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.valor_diaria IS 'Valor da diária usado para análise de Ticket Médio';
COMMENT ON COLUMN public.tenants.custo_fixo_mensal IS 'Custo fixo mensal do estabelecimento para cálculo de ponto de equilíbrio';
