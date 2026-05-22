-- =============================================================
-- PARKTOR — Patch 1.2.9 Database Migration (Preferências de Impressão)
-- =============================================================

-- 1. ADICIONAR COLUNA DE PREFERÊNCIA DE IMPRESSÃO
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS print_enabled BOOLEAN DEFAULT true;

-- 2. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON COLUMN public.tenants.print_enabled IS 'Define se o sistema deve disparar a impressão automática de tickets e recibos';
