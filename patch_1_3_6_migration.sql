-- =============================================================
-- PARKTOR — Patch 1.3.6 Database Migration (Tipo de Chave Pix)
-- =============================================================

-- 1. ADICIONAR COLUNA pix_type NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS pix_type TEXT;

-- 2. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.pix_type IS 'Tipo de chave Pix configurada (cpf, cnpj, celular, email, aleatoria)';
