-- =============================================================
-- PARKTOR — Patch 1.4.0 Database Migration
-- Módulo Completo de Mensalistas e Fluxo Integrado de Pátio
-- =============================================================

-- 1. TABELA PRINCIPAL DE MENSALISTAS (Cria se não existir)
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

-- GARANTIR QUE TODAS AS COLUNAS EXISTAM MESMO SE A TABELA JÁ FOI CRIADA PREVIAMENTE
ALTER TABLE public.mensalistas 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS vagas_contratadas INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS valor_mensalidade DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS cobrar_como_rotativo BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS observacoes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- REMOVER RESTRIÇÕES NOT NULL DE COLUNAS LEGADAS CASO EXISTAM NA TABELA MENSALISTAS ANTIGA
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mensalistas' AND column_name = 'placa') THEN
    ALTER TABLE public.mensalistas ALTER COLUMN placa DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mensalistas' AND column_name = 'marca') THEN
    ALTER TABLE public.mensalistas ALTER COLUMN marca DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mensalistas' AND column_name = 'modelo') THEN
    ALTER TABLE public.mensalistas ALTER COLUMN modelo DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mensalistas' AND column_name = 'cor') THEN
    ALTER TABLE public.mensalistas ALTER COLUMN cor DROP NOT NULL;
  END IF;
END $$;

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

-- GARANTIR COLUNAS DE MENSALISTA_VEICULOS
ALTER TABLE public.mensalista_veiculos
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS placa TEXT,
ADD COLUMN IF NOT EXISTS marca TEXT,
ADD COLUMN IF NOT EXISTS modelo TEXT,
ADD COLUMN IF NOT EXISTS cor TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

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

ALTER TABLE public.mensalista_faturas
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mes_referencia TEXT,
ADD COLUMN IF NOT EXISTS vencimento DATE,
ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_mensalista_faturas_tenant ON public.mensalista_faturas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mensalista_faturas_mensalista ON public.mensalista_faturas(mensalista_id);

-- 4. ADICIONAR COLUNAS DE SUPORTE EM VALET_ENTRIES (ENTRADAS DE PÁTIO)
ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS mensalista_id UUID REFERENCES public.mensalistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tipo_estadia TEXT DEFAULT 'rotativo',
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

-- 9. FORÇAR RECARREGAMENTO DO CACHE DO POSTGREST / SUPABASE
NOTIFY pgrst, 'reload schema';

-- =============================================================
-- MIGRATION 1.4.0 CONCLUÍDA COM SUCESSO
-- =============================================================
