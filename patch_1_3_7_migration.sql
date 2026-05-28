-- =============================================================
-- PARKTOR — Patch 1.3.7 Database Migration (Marca e Modelo em Valet Entries)
-- =============================================================

-- 1. ADICIONAR COLUNAS marca E modelo NA TABELA DE VALET_ENTRIES
ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS marca TEXT,
ADD COLUMN IF NOT EXISTS modelo TEXT;

-- 2. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.valet_entries.marca IS 'Marca do veículo (ex: Chevrolet, Fiat, Ford, etc.)';
COMMENT ON COLUMN public.valet_entries.modelo IS 'Modelo do veículo (ex: Onix, Uno, Ka, etc.)';
