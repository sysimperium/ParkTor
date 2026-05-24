-- MIGRATION: CONFIGURAÇÕES DE ROTATIVO POR FAIXAS (PATCH 1.2.10)

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS rotativo_valor_base DECIMAL(10,2) DEFAULT 7.00;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS rotativo_excedente_valor DECIMAL(10,2) DEFAULT 3.00;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS rotativo_carencia_min INTEGER DEFAULT 20;

COMMENT ON COLUMN public.tenants.rotativo_valor_base IS 'Valor base de cada faixa de 2 horas';
COMMENT ON COLUMN public.tenants.rotativo_excedente_valor IS 'Valor do excedente aplicado durante a carência';
COMMENT ON COLUMN public.tenants.rotativo_carencia_min IS 'Tempo de carência em minutos após a tolerância de 5min';

-- 2. ATUALIZAR FUNÇÃO DE CÁLCULO DE VALOR NO BANCO (Sincronizado com 1.2.10)
CREATE OR REPLACE FUNCTION calcular_valor_estadia(
  p_tenant_id UUID,
  p_entrada TIMESTAMPTZ,
  p_saida TIMESTAMPTZ
)
RETURNS TABLE(minutos INTEGER, valor DECIMAL) AS $$
DECLARE
  v_minutos INTEGER;
  v_valor_base DECIMAL;
  v_valor_excedente DECIMAL;
  v_carencia INTEGER;
  v_tolerancia_fixa INTEGER := 5;
  v_duracao_faixa INTEGER := 120;
  v_faixas_consolidadas INTEGER;
  v_tem_excedente BOOLEAN := FALSE;
  v_limite_tolerancia INTEGER;
  v_limite_carencia INTEGER;
  v_valor_final DECIMAL;
BEGIN
  -- Buscar configurações do Tenant
  SELECT 
    COALESCE(rotativo_valor_base, 7.00), 
    COALESCE(rotativo_excedente_valor, 3.00), 
    COALESCE(rotativo_carencia_min, 20)
  INTO v_valor_base, v_valor_excedente, v_carencia
  FROM public.tenants 
  WHERE id = p_tenant_id;

  v_minutos := EXTRACT(EPOCH FROM (p_saida - p_entrada))::INTEGER / 60;

  -- Regra 1: Tolerância inicial gratuita
  IF v_minutos <= v_tolerancia_fixa THEN
    RETURN QUERY SELECT v_minutos, 0.00::DECIMAL;
    RETURN;
  END IF;

  -- 2. Determinar quantas faixas foram consolidadas
  v_faixas_consolidadas := 1;
  IF v_minutos > (v_duracao_faixa + v_tolerancia_fixa + v_carencia) THEN
    v_faixas_consolidadas := 1 + FLOOR((v_minutos - (v_tolerancia_fixa + v_carencia) - 1) / v_duracao_faixa)::INTEGER;
  END IF;

  -- 3. Verificar se incide o excedente
  v_limite_tolerancia := (v_faixas_consolidadas * v_duracao_faixa) + v_tolerancia_fixa;
  v_limite_carencia := v_limite_tolerancia + v_carencia;

  IF v_minutos > v_limite_tolerancia AND v_minutos <= v_limite_carencia THEN
    v_tem_excedente := TRUE;
  END IF;

  -- 4. Valor Total
  v_valor_final := (v_faixas_consolidadas * v_valor_base) + (CASE WHEN v_tem_excedente THEN v_valor_excedente ELSE 0 END);

  RETURN QUERY SELECT v_minutos, v_valor_final;
END;
$$ LANGUAGE plpgsql;

