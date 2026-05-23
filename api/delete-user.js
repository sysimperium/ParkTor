const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { targetUserId, token } = req.body;

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

    // 2. Validar Usuário Alvo
    const { data: targetData } = await supabaseAdmin
      .from('users')
      .select('tenant_id, nivel_acesso')
      .eq('id', targetUserId)
      .single();

    if (!targetData) throw new Error('Funcionário não encontrado.');

    if (requesterData.nivel_acesso !== 'root' && targetData.tenant_id !== requesterData.tenant_id) {
      throw new Error('Você não tem permissão para excluir este funcionário.');
    }

    // 3. Impedir que ADMIN exclua a si próprio ou outro ADMIN (Opcional, mas seguro)
    if (requesterData.nivel_acesso === 'admin' && targetData.nivel_acesso === 'admin') {
        throw new Error('Um administrador não pode excluir outro administrador.');
    }

    // 4. Deletar no Auth (isso dispara a remoção no public.users se houver CASCADE, 
    // mas vamos garantir deletando ambos se necessário)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (deleteAuthError) throw deleteAuthError;

    // A tabela public.users geralmente tem uma FK com ON DELETE CASCADE, 
    // mas se não tiver, o comando acima já é o principal.

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};
