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
    const { data: { user: requesterAuth }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requesterAuth) throw new Error('Não autorizado');

    const { data: adminData } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso, tenant_id')
      .eq('id', requesterAuth.id)
      .single();

    if (adminData.nivel_acesso !== 'admin' && adminData.nivel_acesso !== 'root') {
      throw new Error('Apenas administradores podem criar funcionários.');
    }

    // 2. Validar Limites de Plano (PATCH 1.2.5)
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*, planos(nome)')
      .eq('id', adminData.tenant_id)
      .single();

    if (tenantError) throw new Error('Erro ao buscar dados do plano');
    
    // Normalização: Se o plano contém "Free" ou "Teste", tratamos como "Start" (PATCH 1.2.5 CORRECTION)
    const planoNome = tenantData.planos?.nome || 'Start';
    const isStartLike = planoNome === 'Start' || planoNome.toLowerCase().includes('free') || planoNome.toLowerCase().includes('teste');

    const { data: existingUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso')
      .eq('tenant_id', adminData.tenant_id);

    if (usersError) throw new Error('Erro ao verificar usuários existentes');

    const totalUsers = existingUsers.length;
    const manobristas = existingUsers.filter(u => u.nivel_acesso === 'manobrista').length;
    const operadores = existingUsers.filter(u => u.nivel_acesso === 'operador').length;

    if (isStartLike) {
      if (nivel_acesso === 'manobrista' && manobristas >= 1) {
        throw new Error(`O plano ${planoNome} só permite 1 manobrista e 1 operador. Para mais, realize um UPDATE de Plano.`);
      }
      if (nivel_acesso === 'operador' && operadores >= 1) {
        throw new Error(`O plano ${planoNome} só permite 1 manobrista e 1 operador. Para mais, realize um UPDATE de Plano.`);
      }
    } else if (planoNome === 'Básico') {
      if (totalUsers >= 5) {
        throw new Error('O plano Básico permite no máximo 5 usuários (incluindo o Admin).');
      }
      if (nivel_acesso === 'manobrista' && manobristas >= 2) {
        throw new Error('O plano Básico permite no máximo 2 manobristas.');
      }
      if (nivel_acesso === 'operador' && operadores >= 2) {
        throw new Error('O plano Básico permite no máximo 2 operadores.');
      }
    } else if (planoNome === 'Pro') {
      if (totalUsers >= 15) {
        throw new Error('O plano Pro permite no máximo 15 usuários.');
      }
    }

    // Impedir criação de ADMIN por outro ADMIN
    if (adminData.nivel_acesso === 'admin' && nivel_acesso === 'admin') {
      throw new Error('Apenas o ROOT pode criar administradores.');
    }

    // 3. Criar no Auth
    const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        nome,
        username
      }
    });

    if (createError) throw createError;

    // 4. Criar ou Atualizar na tabela pública vinculando ao mesmo tenant do admin
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
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};
