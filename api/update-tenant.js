const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tenantId, updates, token } = req.body;

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Validar ROOT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error('Não autorizado');

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nivel_acesso')
      .eq('id', user.id)
      .single();

    if (userError || userData.nivel_acesso !== 'root') {
      throw new Error('Permissão negada.');
    }

    // 2. Atualizar Tenant
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
