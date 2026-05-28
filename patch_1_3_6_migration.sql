-- =============================================================
-- PARKTOR — Patch 1.3.6 Database Migration (Configurações Pix do Estabelecimento)
-- =============================================================

-- 1. ADICIONAR COLUNAS pix_type, pix_name, pix_city E print_pix_qr NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS pix_type TEXT,
ADD COLUMN IF NOT EXISTS pix_name TEXT,
ADD COLUMN IF NOT EXISTS pix_city TEXT,
ADD COLUMN IF NOT EXISTS print_pix_qr BOOLEAN DEFAULT FALSE;

-- 2. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.pix_type IS 'Tipo de chave Pix configurada (cpf, cnpj, celular, email, aleatoria)';
COMMENT ON COLUMN public.tenants.pix_name IS 'Nome do recebedor cadastrado para o Pix do estabelecimento';
COMMENT ON COLUMN public.tenants.pix_city IS 'Cidade do recebedor cadastrada para o Pix do estabelecimento';
COMMENT ON COLUMN public.tenants.print_pix_qr IS 'Indica se deve imprimir o QR Code Pix no comprovante de saída';
