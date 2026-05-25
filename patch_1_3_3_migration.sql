-- MIGRATION: SISTEMA DE NOTIFICAÇÃO DE PAGAMENTO (PATCH 1.3.3)

-- 1. Adicionar coluna para rastrear quando o pagamento foi informado
ALTER TABLE public.platform_invoices 
ADD COLUMN IF NOT EXISTS notificado_em TIMESTAMPTZ;

-- 2. Atualizar a constraint de status para permitir 'em_analise'
-- Primeiro removemos a antiga (o nome padrão costuma ser platform_invoices_status_check)
ALTER TABLE public.platform_invoices DROP CONSTRAINT IF EXISTS platform_invoices_status_check;

-- Adicionamos a nova constraint com o novo status
ALTER TABLE public.platform_invoices 
ADD CONSTRAINT platform_invoices_status_check 
CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado', 'em_analise'));

-- 3. Habilitar Permissão de UPDATE para o Admin (Patch 1.3.3)
-- O Admin precisa de permissão para mudar o status para 'em_analise'
CREATE POLICY "Admin pode notificar pagamento" 
ON public.platform_invoices FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.nivel_acesso = 'admin' 
        AND users.tenant_id = platform_invoices.tenant_id
    )
)
WITH CHECK (
    status = 'em_analise' -- O Admin só pode mudar para este status específico
);

-- Nota: O administrador (Admin) poderá atualizar o status para 'em_analise'
-- O Root poderá atualizar de 'em_analise' para 'pago'.
