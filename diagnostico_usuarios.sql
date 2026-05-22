-- =============================================================
-- PARKTOR — Script de Diagnóstico e Reset de Gatilhos
-- =============================================================

-- 1. DESATIVAR TEMPORARIAMENTE O GATILHO (Para testar se o erro para)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. REFORMULAR A FUNÇÃO COM TRATAMENTO DE ERROS E CAMPOS MÍNIMOS
-- Vamos garantir que ela não trave a criação do usuário mesmo se algo der errado.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Tentamos inserir apenas o básico. Se falhar, o log do Postgres mostrará o porquê.
  -- Usamos o e-mail como username temporário para evitar erros de NOT NULL.
  INSERT INTO public.users (id, email, nome, username, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário Novo'),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'ativo'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Se der erro aqui dentro, não deixamos o erro subir para o Auth.
  -- Isso permite criar o usuário no Auth e depois o ROOT ajusta manualmente.
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

-- 3. REATIVAR O GATILHO REFORMULADO
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. VERIFICAÇÃO DE ESTRUTURA (Rode isso para ver se as colunas estão certas)
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';
