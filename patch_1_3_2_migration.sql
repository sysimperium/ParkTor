-- MIGRATION: CONFIGURAÇÕES GLOBAIS DA PLATAFORMA (PATCH 1.3.2)

-- 1. Criar Tabela de Configurações Globais (acessível apenas por root ou via funções seguras)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso
-- ROOT: Acesso Total
CREATE POLICY "Root pode tudo em settings" 
ON public.platform_settings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.nivel_acesso = 'root'
    )
);

-- Todos os usuários logados podem VER (para gerar o PIX)
CREATE POLICY "Todos autenticados podem ver settings" 
ON public.platform_settings FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 4. Inserir chave PIX inicial (vazia)
INSERT INTO public.platform_settings (key, value) 
VALUES ('pix_key', '') 
ON CONFLICT (key) DO NOTHING;
