module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { placa } = req.query;
  if (!placa) {
    return res.status(200).send("Falta placa");
  }

  const cleanedPlaca = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const { gotScraping } = await import('got-scraping');

  try {
    const tfbRes = await gotScraping({
      url: `https://www.tabelafipebrasil.com/placa/${cleanedPlaca}`,
      timeout: { request: 5000 }
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <h1>TFB Status: ${tfbRes.statusCode}</h1>
      <h2>TFB HTML Length: ${tfbRes.body.length}</h2>
      <div style="border: 2px solid red; padding: 10px; margin-top: 10px;">
        ${tfbRes.body}
      </div>
    `);
  } catch (err) {
    return res.status(200).send(`Error fetching: ${err.message}`);
  }
};
