const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { targetUserId, updates, token } = req.body;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Validar Usuário Solicitante
    const { data: { user: requesterAuth }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requesterAuth) throw new Error('Não autorizado');

    const { data: requesterData } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso, tenant_id')
      .eq('id', requesterAuth.id)
      .single();

    if (requesterData.nivel_acesso !== 'admin' && requesterData.nivel_acesso !== 'root') {
      throw new Error('Permissão negada.');
    }

    // 2. Validar Usuário Alvo (pertence ao mesmo tenant?)
    const { data: targetData } = await supabaseAdmin
      .from('users')
      .select('tenant_id, nivel_acesso')
      .eq('id', targetUserId)
      .single();

    if (!targetData) throw new Error('Funcionário não encontrado.');

    if (requesterData.nivel_acesso !== 'root' && targetData.tenant_id !== requesterData.tenant_id) {
      throw new Error('Você não tem permissão para editar este funcionário.');
    }

    // 3. Validar Limites de Plano se o nivel_acesso estiver sendo alterado (PATCH 1.2.5)
    if (updates.nivel_acesso && updates.nivel_acesso !== targetData.nivel_acesso) {
        const { data: tenantData } = await supabaseAdmin
          .from('tenants')
          .select('*, planos(nome)')
          .eq('id', requesterData.tenant_id)
          .single();

        const planoNome = tenantData.planos?.nome;
        const { data: existingUsers } = await supabaseAdmin
          .from('users')
          .select('id, nivel_acesso')
          .eq('tenant_id', requesterData.tenant_id);

        const others = existingUsers.filter(u => u.id !== targetUserId);
        const manobristas = others.filter(u => u.nivel_acesso === 'manobrista').length;
        const operadores = others.filter(u => u.nivel_acesso === 'operador').length;

        if (planoNome === 'Start') {
          if (updates.nivel_acesso === 'manobrista' && manobristas >= 1) {
            throw new Error('O plano Start só permite 1 manobrista e 1 operador.');
          }
          if (updates.nivel_acesso === 'operador' && operadores >= 1) {
            throw new Error('O plano Start só permite 1 manobrista e 1 operador.');
          }
        } else if (planoNome === 'Básico') {
          if (updates.nivel_acesso === 'manobrista' && manobristas >= 2) {
            throw new Error('O plano Básico permite no máximo 2 manobristas.');
          }
          if (updates.nivel_acesso === 'operador' && operadores >= 2) {
            throw new Error('O plano Básico permite no máximo 2 operadores.');
          }
        }
    }

    // 4. Bloquear alteração para nível 'admin' se o solicitante for 'admin'
    if (requesterData.nivel_acesso === 'admin' && updates.nivel_acesso === 'admin') {
       delete updates.nivel_acesso; 
    }

    // 5. Atualizar no Auth se houver senha ou email
    let authUpdates = {};
    if (updates.password) authUpdates.password = updates.password;
    if (updates.email) authUpdates.email = updates.email;

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        authUpdates
      );
      if (authUpdateError) throw authUpdateError;
    }

    // 6. Atualizar na tabela pública
    const publicUpdates = {
      nome: updates.nome,
      nivel_acesso: updates.nivel_acesso,
      username: updates.username
    };
    Object.keys(publicUpdates).forEach(key => publicUpdates[key] === undefined && delete publicUpdates[key]);

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update(publicUpdates)
      .eq('id', targetUserId);

    if (profileError) throw profileError;

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
