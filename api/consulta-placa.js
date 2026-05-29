module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { placa } = req.query;

  if (!placa) {
    return res.status(400).json({ error: 'Placa não fornecida' });
  }

  const cleanPlaca = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleanPlaca.length !== 7) {
    return res.status(400).json({ error: 'Placa inválida. Deve conter 7 caracteres alfanuméricos.' });
  }

  const url = 'https://rvtadagumhsdibunuwpv.supabase.co/functions/v1/consulta-fipe';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2dGFkYWd1bWhzZGlidW51d3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjA2NDEsImV4cCI6MjA4Mzg5NjY0MX0.ubeakYX9AREDA2tDafwdRVkPwzI-VVyutiX9pyrLiqs';

  let attempts = 0;
  const maxAttempts = 3;
  let lastError = null;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`Consultando placa ${cleanPlaca} (tentativa ${attempts})...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'apikey': apiKey,
          'content-type': 'application/json',
          'x-client-info': 'supabase-js-web/2.90.1'
        },
        body: JSON.stringify({ placa: cleanPlaca })
      });

      if (response.status === 429) {
        lastError = new Error('Limite de requisições excedido (429). Tentando novamente...');
        if (attempts < maxAttempts) {
          // Wait 1.5s before retrying to clear burst limits
          await new Promise(resolve => setTimeout(resolve, 1500));
          continue;
        }
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API externa retornou status ${response.status}: ${text}`);
      }

      const data = await response.json();
      if (data.success) {
        const base = data.baseVehicle || (data.vehicles && data.vehicles[0]);
        if (base) {
          return res.status(200).json({
            marca: base.marca,
            modelo: base.modelo,
            ano: base.anoModelo || base.ano || '',
            cor: base.cor || '',
            municipio: base.municipio || '',
            uf: base.uf || ''
          });
        } else {
          return res.status(404).json({ error: 'Veículo não encontrado ou dados não estruturados' });
        }
      } else {
        return res.status(404).json({ error: data.message || data.error || 'Erro na consulta do veículo' });
      }

    } catch (err) {
      console.error(`Erro na tentativa ${attempts}:`, err.message);
      lastError = err;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  return res.status(500).json({ error: lastError ? lastError.message : 'Erro interno ao consultar placa' });
};
