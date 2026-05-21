const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nome, username, email, password, nivel_acesso, token } = req.body;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Validar se quem está pedindo é um ADMIN (ou ROOT)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Não autorizado');

    const { data: adminData } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso, tenant_id')
      .eq('id', user.id)
      .single();

    if (adminData.nivel_acesso !== 'admin' && adminData.nivel_acesso !== 'root') {
      throw new Error('Apenas administradores podem criar funcionários.');
    }

    // 2. Criar no Auth
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome }
    });

    if (createError) throw createError;

    // 3. Criar ou Atualizar na tabela pública vinculando ao mesmo tenant do admin
    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: newAuthUser.user.id,
      tenant_id: adminData.tenant_id,
      nome,
      username,
      email,
      nivel_acesso,
      status: 'ativo'
    });

    if (profileError) throw profileError;

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
