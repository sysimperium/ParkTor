const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Forçar a Vercel a empacotar dependências dinâmicas do stealth
try {
  require('puppeteer-extra-plugin-user-preferences');
  require('puppeteer-extra-plugin-user-data-dir');
} catch (e) {}

puppeteer.use(StealthPlugin());

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

  let browser = null;
  try {
    let launchOptions = {
      headless: true
    };

    // Configuração para rodar na Vercel usando @sparticuz/chromium
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
      console.log("Running in Vercel. Configuring @sparticuz/chromium...");
      const chromium = require('@sparticuz/chromium');
      const executablePath = await chromium.executablePath();
      
      // CRITICAL: Set LD_LIBRARY_PATH so Chromium can find libraries (like libnss3.so)
      const path = require('path');
      const execDir = path.dirname(executablePath);
      process.env.LD_LIBRARY_PATH = `${execDir}:${execDir}/lib:/tmp:/tmp/lib:${process.env.LD_LIBRARY_PATH || ''}`;

      launchOptions = {
        args: [...chromium.args, "--no-sandbox"],
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      };
    } else {
      console.log("Running locally. Launching standard Puppeteer...");
      if (process.platform === 'win32') {
        const paths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
        ];
        const fs = require('fs');
        for (const p of paths) {
          if (fs.existsSync(p)) {
            launchOptions.executablePath = p;
            break;
          }
        }
      }
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" });
    await page.setCacheEnabled(true);

    const url = `https://www.keplaca.com/placa/${cleanedPlaca.toLowerCase()}`;
    console.log(`Querying keplaca.com using Puppeteer Stealth: ${url}...`);

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 15000
    });

    const html = await page.content();
    await browser.close();
    browser = null;

    const $ = cheerio.load(html);
    let brand = null;
    let model = null;

    $("table.fipeTablePriceDetail tr").each((index, element) => {
      const key = $(element).find("td:first-child").text().replace(":", "").trim().toLowerCase();
      const val = $(element).find("td:last-child").text().trim();
      
      if (key === 'marca') {
        brand = val.toUpperCase();
      } else if (key === 'modelo') {
        model = val.toUpperCase();
      }
    });

    if (brand && model) {
      console.log(`Found on keplaca.com: ${brand} - ${model}`);
      return res.status(200).json({ marca: brand, modelo: model });
    } else {
      return res.status(404).json({ error: 'Veículo não encontrado para a placa informada.' });
    }

  } catch (err) {
    console.error(`Erro ao consultar keplaca: ${err.message}`);
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Erro ao fechar browser:", closeErr);
      }
    }
    return res.status(500).json({ error: `Erro na consulta da placa: ${err.message}` });
  }
};
