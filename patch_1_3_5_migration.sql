-- =============================================================
-- PARKTOR — Patch 1.3.5 Database Migration (Acesso Root a Valet Entries)
-- =============================================================

-- Garante que usuários com nível de acesso ROOT possam ler todas as entradas (valet_entries) de todos os tenants
DROP POLICY IF EXISTS "Root pode ler todas as entradas de valet" ON public.valet_entries;

CREATE POLICY "Root pode ler todas as entradas de valet" ON public.valet_entries
  FOR SELECT TO authenticated
  USING (
    (SELECT nivel_acesso FROM public.users WHERE id = auth.uid()) = 'root'
  );
