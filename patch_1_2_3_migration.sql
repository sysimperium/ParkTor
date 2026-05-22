-- =============================================================
-- PARKTOR — Patch 1.2.3 Database Migration
-- =============================================================

-- 1. ATUALIZAR FUNÇÃO DE CÁLCULO DE VALOR (Regra 0-5 min isento, 6+ min R$ 7)
CREATE OR REPLACE FUNCTION calcular_valor_estadia(
  p_tenant_id UUID,
  p_entrada TIMESTAMPTZ,
  p_saida TIMESTAMPTZ
)
RETURNS TABLE(minutos INTEGER, valor DECIMAL) AS $$
DECLARE
  v_minutos INTEGER;
  v_valor_base DECIMAL := 7.00;
  v_valor_excedente DECIMAL := 3.00;
  v_intervalo_base INTEGER := 120; -- 2 horas
  v_tolerancia INTEGER := 20;
  v_valor_final DECIMAL := 0.00;
  v_blocos_completos INTEGER;
  v_minutos_restantes INTEGER;
BEGIN
  v_minutos := EXTRACT(EPOCH FROM (p_saida - p_entrada)) / 60;

  IF v_minutos <= 5 THEN
    RETURN QUERY SELECT v_minutos::INTEGER, 0.00;
    RETURN;
  END IF;

  -- Número de blocos de 2 horas completos
  v_blocos_completos := FLOOR(v_minutos / v_intervalo_base);
  v_minutos_restantes := v_minutos % v_intervalo_base;

  -- Valor pelos blocos completos
  v_valor_final := v_blocos_completos * v_valor_base;

  -- Lógica para os minutos que sobraram
  IF v_minutos_restantes > 0 THEN
    IF v_minutos_restantes <= v_tolerancia THEN
      -- Dentro da tolerância de 20 min: paga valor acumulado + excedente de R$ 3
      v_valor_final := v_valor_final + v_valor_excedente;
    ELSE
      -- Passou da tolerância: paga o próximo bloco cheio de R$ 7
      v_valor_final := v_valor_final + v_valor_base;
    END IF;
  END IF;

  -- Garantia de valor mínimo: se ficou mais de 5min, o valor mínimo é R$ 7,00 (1º bloco).
  IF v_valor_final < v_valor_base AND v_minutos > 5 THEN
     v_valor_final := v_valor_base;
  END IF;

  RETURN QUERY SELECT v_minutos::INTEGER, v_valor_final;
END;
$$ LANGUAGE plpgsql;

-- 2. TABELA DE SESSÕES DE CAIXA
CREATE TABLE IF NOT EXISTS public.cashier_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  user_id UUID REFERENCES public.users(id),
  abertura TIMESTAMPTZ DEFAULT now(),
  fechamento TIMESTAMPTZ,
  valor_inicial DECIMAL(10,2) DEFAULT 0.00,
  valor_final DECIMAL(10,2),
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado'))
);

-- RLS para sessões de caixa
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tenant's cashier sessions" 
ON public.cashier_sessions FOR ALL TO authenticated 
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- 3. TABELA DE PAGAMENTOS MÚLTIPLOS
CREATE TABLE IF NOT EXISTS public.valet_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id),
  entry_id UUID REFERENCES public.valet_entries(id) ON DELETE CASCADE,
  forma_pagamento TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para pagamentos
ALTER TABLE public.valet_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tenant's payments" 
ON public.valet_payments FOR ALL TO authenticated 
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- 4. ADICIONAR COLUNA DE ID DA SESSÃO EM VALET_ENTRIES (PATCH 1.2.3)
ALTER TABLE public.valet_entries ADD COLUMN IF NOT EXISTS cashier_session_id UUID REFERENCES public.cashier_sessions(id);

-- 5. ATUALIZAR VIEW DE RESUMO DO DIA PARA CONSIDERAR MÚLTIPLOS PAGAMENTOS (Se necessário)
-- Como não tenho a definição original, vou apenas preparar a estrutura.
