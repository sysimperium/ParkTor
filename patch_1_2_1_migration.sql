-- =============================================================
-- PARKTOR — Patch 1.2.1 Database Migration
-- Execute este script no SQL Editor do Supabase para atualizar
-- a lógica de preços e gatilhos de usuário.
-- =============================================================

-- 1. ATUALIZAR FUNÇÃO DE CÁLCULO DE VALOR (Regras 1.2.1)
-- 7 reais por blocos de 2h | 3 reais adicional até 20min de tolerância
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

  IF v_minutos <= 0 THEN
    RETURN QUERY SELECT 0, 0.00;
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

  -- Garantia de valor mínimo: se ficou mais de 20min (tolerância total inicial),
  -- o valor mínimo deve ser pelo menos R$ 7,00 (1º bloco).
  IF v_valor_final < v_valor_base AND v_minutos > v_tolerancia THEN
     v_valor_final := v_valor_base;
  END IF;

  RETURN QUERY SELECT v_minutos, v_valor_final;
END;
$$ LANGUAGE plpgsql;


-- 2. GARANTIR TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL (public.users)
-- Evita erros de login ao criar novos usuários via API ou Dashboard
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, status)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'), 'ativo')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

-- Remove se já existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. GARANTIR POLÍTICA DE LEITURA PÚBLICA PARA LOGIN (RLS)
-- Necessário para o login por username encontrar o e-mail associado
DROP POLICY IF EXISTS "users_public_read_login" ON public.users;

CREATE POLICY "users_public_read_login" ON public.users
  FOR SELECT TO anon
  USING (true);

-- 4. GARANTIR POLÍTICA DE LEITURA DE PLANOS
-- Necessário para carregar os limites no Dashboard e Configurações
DROP POLICY IF EXISTS "Permitir leitura de planos para usuários autenticados" ON public.planos;

CREATE POLICY "Permitir leitura de planos para usuários autenticados" 
ON public.planos 
FOR SELECT 
TO authenticated 
USING (true);

-- =============================================================
-- MIGRATION CONCLUÍDA
-- =============================================================
