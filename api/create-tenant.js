const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // 1. Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantNome, tenantPlano, adminEmail, adminUsername, adminSenha, token } = req.body;

  // 2. Inicializar Supabase com SERVICE_ROLE (Poder total - Seguro no Backend)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 3. Validar se quem está pedindo é realmente um ROOT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Não autorizado');

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso')
      .eq('id', user.id)
      .single();

    if (userError || userData.nivel_acesso !== 'root') {
      throw new Error('Permissão negada: Apenas o ROOT pode criar novos estacionamentos.');
    }

    // 4. Criar o usuário no Auth (sem precisar confirmar e-mail)
    const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminSenha,
      email_confirm: true,
      user_metadata: { nome: 'Admin ' + tenantNome }
    });

    if (createAuthError) throw createAuthError;

    // 5. Criar o Tenant
    const { data: newTenant, error: tenantError } = await supabaseAdmin.from('tenants').insert({
      nome: tenantNome,
      plano_id: tenantPlano,
      status: 'ativo'
    }).select().single();

    if (tenantError) throw tenantError;

    // 6. Atualizar o profile do novo Admin na tabela public.users
    const { error: profileError } = await supabaseAdmin.from('users').update({
      tenant_id: newTenant.id,
      nome: 'Admin ' + tenantNome,
      username: adminUsername,
      email: adminEmail,
      nivel_acesso: 'admin',
      status: 'ativo'
    }).eq('id', newAuthUser.user.id);

    if (profileError) throw profileError;

    return res.status(200).json({ success: true, message: 'Estacionamento e Admin criados!' });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};
