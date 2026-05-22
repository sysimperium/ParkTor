-- =============================================================
-- PARKTOR — Patch 1.2.8 Database Migration (Correção de Trigger)
-- =============================================================

-- 1. ATUALIZAR FUNÇÃO DE CRIAÇÃO AUTOMÁTICA DE PERFIL (public.users)
-- O erro "Database error creating new user" ocorre quando este trigger falha.
-- Adicionamos suporte ao campo 'username' capturado dos metadados.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, username, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Novo Usuário'),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), -- Usa o e-mail como fallback para username
    'ativo'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

-- 2. COMENTÁRIO
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente o perfil na tabela pública ao registrar no Auth, agora com suporte a username';
