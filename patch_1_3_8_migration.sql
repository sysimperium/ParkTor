-- =============================================================
-- PARKTOR — Patch 1.3.8 Database Migration (Tabela Global de Veículos)
-- =============================================================

-- 1. CRIAÇÃO DA TABELA VEICULOS
CREATE TABLE IF NOT EXISTS public.veiculos (
  placa TEXT PRIMARY KEY,
  marca TEXT,
  modelo TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS DE RLS PARA USUÁRIOS AUTENTICADOS (TODOS OS TENANTS)
-- Permite leitura de qualquer veículo para qualquer usuário autenticado
DROP POLICY IF EXISTS "Permitir leitura de veículos para usuários autenticados" ON public.veiculos;
CREATE POLICY "Permitir leitura de veículos para usuários autenticados" 
ON public.veiculos 
FOR SELECT 
TO authenticated 
USING (true);

-- Permite inserção/atualização (upsert) de veículos para qualquer usuário autenticado
DROP POLICY IF EXISTS "Permitir upsert de veículos para usuários autenticados" ON public.veiculos;
CREATE POLICY "Permitir upsert de veículos para usuários autenticados" 
ON public.veiculos 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 4. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.veiculos IS 'Tabela global de veículos compartilhada entre todos os tenants para autocompletar marca e modelo';
COMMENT ON COLUMN public.veiculos.placa IS 'Placa do veículo (Chave primária única)';
COMMENT ON COLUMN public.veiculos.marca IS 'Marca do veículo';
COMMENT ON COLUMN public.veiculos.modelo IS 'Modelo do veículo';
