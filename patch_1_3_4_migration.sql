-- =============================================================
-- PARKTOR — Patch 1.3.4 Database Migration (Captura de Placa por Foto)
-- =============================================================

-- 1. ADICIONAR COLUNA ocr_enabled NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS ocr_enabled BOOLEAN DEFAULT FALSE;

-- 2. ADICIONAR COLUNA placa_foto_url NA TABELA DE VALET_ENTRIES
ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS placa_foto_url TEXT;

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.ocr_enabled IS 'Indica se a opção de leitura de placa por foto (OCR) está ativa para o estabelecimento';
COMMENT ON COLUMN public.valet_entries.placa_foto_url IS 'URL pública da foto da placa capturada na entrada do veículo';
