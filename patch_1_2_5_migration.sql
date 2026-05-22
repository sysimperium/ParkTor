-- =============================================================
-- PARKTOR — Patch 1.2.5 Database Migration (Logotipo e Identidade)
-- =============================================================

-- 1. ADICIONAR COLUNA DE LOGO NA TABELA DE TENANTS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. CRIAR BUCKET DE ARMAZENAMENTO (STORAGE)
-- Este bloco cria o bucket "public" se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- 3. DEFINIR POLÍTICAS DE SEGURANÇA DO STORAGE (RLS)
-- Permitir que qualquer pessoa veja as imagens (leitura pública)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura Pública' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Leitura Pública" ON storage.objects FOR SELECT USING (bucket_id = 'public');
    END IF;
END $$;

-- Permitir que usuários logados enviem fotos (escrita autenticada)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Upload Autenticado' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Upload Autenticado" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'public');
    END IF;
END $$;

-- 4. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.logo_url IS 'URL pública do logotipo do estabelecimento armazenada no Supabase Storage';
