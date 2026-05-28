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

  // Import got-scraping dynamically since it is an ESM module
  const { gotScraping } = await import('got-scraping');

  function extractMarcaModelo(html) {
    try {
      const $ = cheerio.load(html);
      let marcaLocal = null;
      let modeloLocal = null;

      $("table.fipeTablePriceDetail tr").each((index, element) => {
        const key = $(element).find("td:first-child").text().replace(":", "").trim().toLowerCase();
        const val = $(element).find("td:last-child").text().trim();
        
        if (key === 'marca') {
          marcaLocal = val.toUpperCase();
        } else if (key === 'modelo') {
          modeloLocal = val.toUpperCase();
        }
      });
      return { marca: marcaLocal, modelo: modeloLocal };
    } catch (e) {
      console.error("Erro no parser Cheerio:", e);
      return { marca: null, modelo: null };
    }
  }

  // Source 1: tabelafipebrasil.com
  try {
    console.log(`Querying tabelafipebrasil.com for ${cleanedPlaca}...`);
    const tfbRes = await gotScraping({
      url: `https://www.tabelafipebrasil.com/placa/${cleanedPlaca}`,
      timeout: { request: 5000 }
    });

    if (tfbRes.statusCode === 200) {
      const parsed = extractMarcaModelo(tfbRes.body);
      if (parsed.marca && parsed.modelo) {
        brand = parsed.marca;
        model = parsed.modelo;
        console.log(`Found on tabelafipebrasil.com: ${brand} - ${model}`);
      }
    } else {
      console.log(`tabelafipebrasil.com returned status: ${tfbRes.statusCode}`);
    }
  } catch (err) {
    console.error(`Erro ao consultar tabelafipebrasil: ${err.message}`);
  }

  // Source 2: keplaca.com (fallback)
  if (!brand || !model) {
    try {
      console.log(`Querying keplaca.com for ${cleanedPlaca}...`);
      const kpRes = await gotScraping({
        url: `https://www.keplaca.com/placa?placa-fipe=${cleanedPlaca.toLowerCase()}`,
        timeout: { request: 5000 }
      });

      if (kpRes.statusCode === 200) {
        const parsed = extractMarcaModelo(kpRes.body);
        if (parsed.marca && parsed.modelo) {
          brand = parsed.marca;
          model = parsed.modelo;
          console.log(`Found on keplaca.com: ${brand} - ${model}`);
        }
      } else {
        console.log(`keplaca.com returned status: ${kpRes.statusCode}`);
      }
    } catch (err) {
      console.error(`Erro ao consultar keplaca: ${err.message}`);
    }
  }

  if (brand && model) {
    return res.status(200).json({ marca: brand, modelo: model });
  } else {
    return res.status(404).json({ error: 'Veículo não encontrado para a placa informada.' });
  }
};
