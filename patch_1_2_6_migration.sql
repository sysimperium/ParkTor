-- =============================================================
-- PARKTOR — Patch 1.2.6 Database Migration (Correção de Colunas)
-- =============================================================

-- 1. ADICIONAR COLUNAS DE RASTREAMENTO DE OPERADOR (CASO NÃO EXISTAM)
ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS operador_entrada_id UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS operador_saida_id UUID REFERENCES public.users(id);

-- 2. CORREÇÃO DA COLUNA ticket_numero (PATCH 1.2.6)
-- Cria uma sequência para o número do ticket caso não exista
CREATE SEQUENCE IF NOT EXISTS valet_entries_ticket_numero_seq;

-- Define a sequência como valor padrão para a coluna ticket_numero
-- Isso evita o erro de "not-null constraint" quando o frontend não envia o número
ALTER TABLE public.valet_entries 
ALTER COLUMN ticket_numero SET DEFAULT nextval('valet_entries_ticket_numero_seq');

-- 3. MIGRAÇÃO DE DADOS (OPCIONAL)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'valet_entries' AND column_name = 'operador_id') THEN
    UPDATE public.valet_entries SET operador_entrada_id = operador_id WHERE operador_entrada_id IS NULL;
  END IF;
END $$;

-- 3. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.valet_entries.operador_entrada_id IS 'ID do usuário que registrou a entrada do veículo';
COMMENT ON COLUMN public.valet_entries.operador_saida_id IS 'ID do usuário que registrou a saída/pagamento do veículo';

-- 4. ATUALIZAR VIEW DE VEÍCULOS ATIVOS (Se necessário para refletir novas colunas)
-- (O sistema usa v_veiculos_ativos em alguns locais)
