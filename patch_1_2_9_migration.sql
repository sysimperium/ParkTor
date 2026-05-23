-- MIGRATION: SISTEMA DE FATURAMENTO DA PLATAFORMA (PATCH 1.2.9)

-- 1. Criar Tabela de Faturas (Mensalidades dos Estacionamentos)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    mes_referencia TEXT NOT NULL, -- Formato: 'YYYY-MM'
    vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    data_pagamento TIMESTAMPTZ,
    forma_pagamento TEXT, -- 'pix', 'boleto', 'cartao'
    link_pagamento TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acesso
-- ROOT: Acesso Total
CREATE POLICY "Root pode tudo em faturas" 
ON public.platform_invoices FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() AND users.nivel_acesso = 'root'
    )
);

-- ADMIN: Ver apenas as faturas do próprio estacionamento
CREATE POLICY "Admin vê faturas do próprio tenant" 
ON public.platform_invoices FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.nivel_acesso = 'admin' 
        AND users.tenant_id = platform_invoices.tenant_id
    )
);

-- 4. Inserir coluna de data de vencimento padrão na tabela de tenants (opcional para facilitar)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 10;
