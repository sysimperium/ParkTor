-- =============================================================
-- PARKTOR — Patch 1.2.8 Database Migration (Sincronia de Nível de Acesso)
-- =============================================================

-- 1. ATUALIZAR FUNÇÃO DE CRIAÇÃO AUTOMÁTICA DE PERFIL (public.users)
-- Esta versão é sincronizada com a API de criação do ROOT.
-- Ela captura o 'nivel_acesso' real enviado nos metadados do Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, username, nivel_acesso, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'nivel_acesso', 'operador'), -- Prioriza o nível enviado pela API
    'ativo'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

-- 2. GARANTIR QUE O GATILHO ESTEJA ATIVO
-- (Caso tenha sido removido em testes anteriores)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. COMENTÁRIO PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente o perfil na tabela pública sincronizando o nivel_acesso enviado pela API do ROOT';
