-- =============================================================
-- PARKTOR — Patch 1.2.5 Database Migration (Logotipo e Identidade)
-- =============================================================

-- 1. ADICIONAR COLUNA DE LOGO NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.logo_url IS 'URL pública do logotipo do estabelecimento armazenada no Supabase Storage';

-- 3. NOTA PARA O ADMINISTRADOR:
-- É necessário criar um bucket chamado "public" no Supabase Storage 
-- e definir as políticas de RLS para permitir leitura pública e escrita autenticada.
