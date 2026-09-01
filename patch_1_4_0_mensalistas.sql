-- =============================================================
-- PARKTOR — Patch 1.4.0 Database Migration
-- Módulo Completo de Mensalistas e Fluxo Integrado de Pátio
-- =============================================================

-- 1. TABELA PRINCIPAL DE MENSALISTAS
CREATE TABLE IF NOT EXISTS public.mensalistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  vagas_contratadas INTEGER NOT NULL DEFAULT 1,
  valor_mensalidade DECIMAL(10,2) DEFAULT NULL, -- Pode ser NULL/0.00 se cadastrado por operador para revisão do ADM
  dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 31),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado', 'atrasado')),
  cobrar_como_rotativo BOOLEAN NOT NULL DEFAULT false, -- Checkbox de pausa: cobra rotativo sem perder histórico
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE VEÍCULOS DOS MENSALISTAS (MÚLTIPLAS PLACAS)
CREATE TABLE IF NOT EXISTS public.mensalista_veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE CASCADE NOT NULL,
  placa TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  cor TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para busca ultrarrápida de placa
CREATE INDEX IF NOT EXISTS idx_mensalista_veiculos_placa ON public.mensalista_veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_mensalista_veiculos_tenant ON public.mensalista_veiculos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensalistas_tenant ON public.mensalistas(tenant_id);

-- 3. TABELA DE FATURAS / MENSALIDADES
CREATE TABLE IF NOT EXISTS public.mensalista_faturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE CASCADE NOT NULL,
  mes_referencia TEXT NOT NULL, -- Ex: '2026-09'
  vencimento DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento TIMESTAMPTZ,
  forma_pagamento TEXT, -- 'pix', 'dinheiro', 'cartao', etc.
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mensalista_faturas_tenant ON public.mensalista_faturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensalista_faturas_mensalista ON public.mensalista_faturas(mensalista_id);

-- 4. ADICIONAR COLUNAS DE SUPORTE EM VALET_ENTRIES (ENTRADAS DE PÁTIO)
ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_estadia TEXT DEFAULT 'rotativo' CHECK (tipo_estadia IN ('rotativo', 'mensalista')),
ADD COLUMN IF NOT EXISTS aviso_saida_solicitado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aviso_saida_em TIMESTAMPTZ DEFAULT NULL;

-- 5. ADICIONAR COLUNA EM TENANTS PARA PERMISSÃO DE OPERADORES CADASTRAR MENSALISTAS
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS operador_cadastra_mensalista BOOLEAN DEFAULT false;

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.mensalistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensalista_veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensalista_faturas ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE RLS PARA USUÁRIOS AUTENTICADOS (ISOLAMENTO POR TENANT)
DROP POLICY IF EXISTS "Users can manage their tenant's mensalistas" ON public.mensalistas;
CREATE POLICY "Users can manage their tenant's mensalistas" 
ON public.mensalistas 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
);

DROP POLICY IF EXISTS "Users can manage their tenant's mensalista_veiculos" ON public.mensalista_veiculos;
CREATE POLICY "Users can manage their tenant's mensalista_veiculos" 
ON public.mensalista_veiculos 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
);

DROP POLICY IF EXISTS "Users can manage their tenant's mensalista_faturas" ON public.mensalista_faturas;
CREATE POLICY "Users can manage their tenant's mensalista_faturas" 
ON public.mensalista_faturas 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND nivel_acesso = 'root')
);

-- 8. POLÍTICA DE LEITURA PÚBLICA PARA CONSULTA DE TICKET (consulta.html)
DROP POLICY IF EXISTS "Public can view mensalista details on public ticket check" ON public.mensalistas;
CREATE POLICY "Public can view mensalista details on public ticket check" 
ON public.mensalistas 
FOR SELECT 
TO anon 
USING (true);

-- =============================================================
-- MIGRATION 1.4.0 CONCLUÍDA COM SUCESSO
-- =============================================================
