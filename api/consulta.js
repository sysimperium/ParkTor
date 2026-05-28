const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://oncrmxipujcydzggxdks.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3JteGlwdWpjeWR6Z2d4ZGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMTUzMjcsImV4cCI6MjA5NDg5MTMyN30.8DB7OHZoV6fd8lmnWAQEwKO6BV6E_TltI6oH20Dhff4';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  const { t, tenant } = req.query;
  const tenantId = t || tenant;

  // Carrega o arquivo HTML estático de consulta
  const htmlPath = path.join(process.cwd(), 'consulta_template.html');
  let htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Valores padrão (Branding global Parktor)
  let nomeEstacionamento = 'Parktor';
  let logoUrl = 'https://parktor.vercel.app/imgs/logoP.png';

  // Validação de UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (tenantId && uuidRegex.test(tenantId.trim())) {
    try {
      const { data, error } = await sb
        .from('tenants')
        .select('nome, logo_url')
        .eq('id', tenantId.trim())
        .single();

      if (data) {
        nomeEstacionamento = data.nome;
        if (data.logo_url) {
          logoUrl = data.logo_url;
        } else {
          logoUrl = 'https://parktor.vercel.app/imgs/SuaMarcaAqui.png';
        }
      }
    } catch (err) {
      console.error('Erro ao buscar metadados do tenant no serverless:', err);
    }
  }

  // Substitui os metadados dinamicamente no HTML para os scrapers do WhatsApp/Facebook
  htmlContent = htmlContent
    .replace(/<title>Parktor — Consulta de Ticket<\/title>/g, `<title>${nomeEstacionamento} — Consulta de Ticket</title>`)
    .replace(/<meta property="og:title" content="Parktor — Consulta de Ticket">/g, `<meta property="og:title" content="${nomeEstacionamento} — Consulta de Ticket">`)
    .replace(/<meta property="og:image" content="https:\/\/parktor\.vercel\.app\/imgs\/logoP\.png">/g, `<meta property="og:image" content="${logoUrl}">`)
    .replace(/<meta property="og:description" content="Consulte o tempo de permanência e a tarifa acumulada do seu veículo no pátio do estacionamento em tempo real\.">/g, `<meta property="og:description" content="Consulte em tempo real o status e valor da estadia do seu veículo no pátio do ${nomeEstacionamento}.">`)
    .replace(/<meta property="twitter:title" content="Parktor — Consulta de Ticket">/g, `<meta property="twitter:title" content="${nomeEstacionamento} — Consulta de Ticket">`)
    .replace(/<meta property="twitter:image" content="https:\/\/parktor\.vercel\.app\/imgs\/logoP\.png">/g, `<meta property="twitter:image" content="${logoUrl}">`)
    .replace(/<meta property="twitter:description" content="Consulte o tempo de permanência e a tarifa acumulada do seu veículo no pátio do estacionamento em tempo real\.">/g, `<meta property="twitter:description" content="Consulte em tempo real o status e valor da estadia do seu veículo no pátio do ${nomeEstacionamento}.">`);

  // Configura cabeçalhos de resposta
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(htmlContent);
};
