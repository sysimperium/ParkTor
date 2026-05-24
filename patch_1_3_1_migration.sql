-- Patch 1.3.1 - Checklist de Avarias
-- Adiciona configuração global por tenant e armazenamento de dados por entrada

ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS checklist_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.valet_entries 
ADD COLUMN IF NOT EXISTS checklist_data JSONB;

-- Comentários para documentação
COMMENT ON COLUMN public.tenants.checklist_enabled IS 'Indica se o checklist de entrada está habilitado para o estacionamento';
COMMENT ON COLUMN public.valet_entries.checklist_data IS 'Armazena as marcações de avarias (riscos e amassados) em formato JSON (coordenadas e tipo)';
