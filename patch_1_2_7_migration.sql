-- =============================================================
-- PARKTOR — Patch 1.2.7 Database Migration (Gestão de Despesas)
-- =============================================================

-- 1. TABELA DE CATEGORIAS DE DESPESAS (Opcional para maior organização)
-- Para simplificar inicialmente, usaremos uma coluna TEXT com sugestões.

-- 2. TABELA DE DESPESAS
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL, -- Aluguel, Folha, Consumo, etc.
  valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  data_vencimento DATE NOT NULL,
  status TEXT DEFAULT 'pago' CHECK (status IN ('pendente', 'pago')),
  tipo TEXT DEFAULT 'variavel' CHECK (tipo IN ('fixa', 'variavel')),
  recorrencia TEXT DEFAULT 'unica' CHECK (recorrencia IN ('unica', 'mensal', 'parcelada')),
  parcela_atual INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS PARA DESPESAS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tenant's expenses" 
ON public.expenses FOR ALL TO authenticated 
USING (tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- 4. COMENTÁRIOS
COMMENT ON TABLE public.expenses IS 'Registro de despesas e custos operacionais do estacionamento';
