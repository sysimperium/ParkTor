const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { placa } = req.query;
  if (!placa) {
    return res.status(400).json({ error: 'Placa não informada' });
  }

  const cleanedPlaca = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanedPlaca.length !== 7) {
    return res.status(400).json({ error: 'Placa inválida. Deve conter 7 caracteres alfanuméricos.' });
  }

  let brand = null;
  let model = null;

  // Source 1: APIBrasil.io (if configured in environment variables)
  const apiBrasilBearer = process.env.APIBRASIL_BEARER_TOKEN || process.env.APIBRASIL_TOKEN;
  const apiBrasilDevice = process.env.APIBRASIL_DEVICE_TOKEN;

  if (apiBrasilBearer && apiBrasilDevice) {
    try {
      console.log(`Querying APIBrasil.io for ${cleanedPlaca}...`);
      const { gotScraping } = await import('got-scraping');
      
      const response = await gotScraping({
        url: 'https://gateway.apibrasil.io/api/v2/vehicles/dados',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiBrasilBearer}`,
          'DeviceToken': apiBrasilDevice
        },
        json: { placa: cleanedPlaca },
        timeout: { request: 6000 },
        retry: { limit: 0 }
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        
        // Use recursive finder to parse brand and model from APIBrasil structure
        const found = findBrandModel(body);
        if (found.marca && found.modelo) {
          brand = found.marca.toUpperCase();
          model = found.modelo.toUpperCase();
          console.log(`Found on APIBrasil.io: ${brand} - ${model}`);
        }
      } else {
        console.log(`APIBRASIL.io returned status: ${response.statusCode}`);
      }
    } catch (err) {
      console.error(`Erro ao consultar APIBrasil.io: ${err.message}`);
    }
  }

  // Source 2: tabelafipebrasil.com (scraper fallback - works locally)
  if (!brand || !model) {
    try {
      console.log(`Querying tabelafipebrasil.com for ${cleanedPlaca}...`);
      const { gotScraping } = await import('got-scraping');
      const tfbRes = await gotScraping({
        url: `https://www.tabelafipebrasil.com/placa/${cleanedPlaca}`,
        timeout: { request: 5000 },
        retry: { limit: 0 }
      });

      if (tfbRes.statusCode === 200) {
        const parsed = extractMarcaModelo(tfbRes.body);
        if (parsed.marca && parsed.modelo) {
          brand = parsed.marca.toUpperCase();
          model = parsed.modelo.toUpperCase();
          console.log(`Found on tabelafipebrasil.com: ${brand} - ${model}`);
        }
      } else {
        console.log(`tabelafipebrasil.com returned status: ${tfbRes.statusCode}`);
      }
    } catch (err) {
      console.error(`Erro ao consultar tabelafipebrasil: ${err.message}`);
    }
  }

  // Source 3: keplaca.com (scraper fallback - works locally)
  if (!brand || !model) {
    try {
      console.log(`Querying keplaca.com for ${cleanedPlaca}...`);
      const { gotScraping } = await import('got-scraping');
      const kpRes = await gotScraping({
        url: `https://www.keplaca.com/placa/${cleanedPlaca.toLowerCase()}`,
        timeout: { request: 5000 },
        retry: { limit: 0 }
      });

      if (kpRes.statusCode === 200) {
        const parsed = extractMarcaModelo(kpRes.body);
        if (parsed.marca && parsed.modelo) {
          brand = parsed.marca.toUpperCase();
          model = parsed.modelo.toUpperCase();
          console.log(`Found on keplaca.com: ${brand} - ${model}`);
        }
      } else {
        console.log(`keplaca.com returned status: ${kpRes.statusCode}`);
      }
    } catch (err) {
      console.error(`Erro ao consultar keplaca: ${err.message}`);
    }
  }

  // Return response in clean JSON format
  if (brand && model) {
    return res.status(200).json({ marca: brand, modelo: model });
  } else {
    return res.status(404).json({ error: 'Veículo não encontrado para a placa informada.' });
  }

  // Helper functions
  function findBrandModel(obj) {
    let marca = null;
    let modelo = null;

    function search(node) {
      if (!node || typeof node !== 'object') return;
      
      if (node.marca && typeof node.marca === 'string') marca = node.marca;
      if (node.brand && typeof node.brand === 'string') marca = node.brand;
      
      if (node.modelo && typeof node.modelo === 'string') modelo = node.modelo;
      if (node.model && typeof node.model === 'string') modelo = node.model;
      
      for (const key in node) {
        if (typeof node[key] === 'object') {
          search(node[key]);
        }
      }
    }

    search(obj);
    return { marca, modelo };
  }

  function extractMarcaModelo(html) {
    try {
      const $ = cheerio.load(html);
      let marcaLocal = null;
      let modeloLocal = null;

      $("table.fipeTablePriceDetail tr").each((index, element) => {
        const key = $(element).find("td:first-child").text().replace(":", "").trim().toLowerCase();
        const val = $(element).find("td:last-child").text().trim();
        
        if (key === 'marca') {
          marcaLocal = val;
        } else if (key === 'modelo') {
          modeloLocal = val;
        }
      });
      return { marca: marcaLocal, modelo: modeloLocal };
    } catch (e) {
      console.error("Erro no parser Cheerio:", e);
      return { marca: null, modelo: null };
    }
  }
};
