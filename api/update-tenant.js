const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tenantId, updates, token } = req.body;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Validar Usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Não autorizado');

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError) throw new Error('Usuário não encontrado.');

    // Permissão: ROOT pode tudo, ADMIN só o próprio tenant
    if (userData.nivel_acesso !== 'root') {
      if (userData.nivel_acesso !== 'admin') throw new Error('Permissão negada.');
      if (userData.tenant_id !== tenantId) throw new Error('Você só pode editar seu próprio estabelecimento.');
    }

    // 2. Validar Limite de Vagas se estiver sendo alterado
    if (updates.total_vagas) {
      const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .select('*, planos(limite_vagas)')
        .eq('id', tenantId)
        .single();
      
      if (tenantError) throw new Error('Erro ao buscar dados do estabelecimento.');
      
      const limit = tenantData.planos?.limite_vagas || 9999;
      if (updates.total_vagas > limit) {
        throw new Error(`O limite do seu plano é de ${limit} vagas.`);
      }
    }

    // 3. Atualizar Tenant
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update(updates)
      .eq('id', tenantId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
