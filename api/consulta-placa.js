const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Forçar a Vercel a empacotar dependências dinâmicas do stealth
// Reciclar containers da Vercel para limpar processos zumbis
try {
  require('puppeteer-extra-plugin-user-preferences');
  require('puppeteer-extra-plugin-user-data-dir');
} catch (e) {}

puppeteer.use(StealthPlugin());

// Global variables for browser reuse (singleton pattern)
let browserInstance = null;
let launchPromise = null;

async function performLaunch() {
  let launchOptions = {
    headless: true
  };

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    console.log("Running in Vercel. Configuring @sparticuz/chromium...");
    const chromium = require('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();
    
    const execDir = path.dirname(executablePath);
    
    let sparticuzBin = '';
    try {
      const sparticuzPath = require.resolve('@sparticuz/chromium');
      if (sparticuzPath.includes('dist')) {
        sparticuzBin = path.join(path.dirname(sparticuzPath), '..', 'bin');
      } else {
        sparticuzBin = path.join(path.dirname(sparticuzPath), 'bin');
      }
    } catch (e) {
      console.error("Erro ao resolver bin do sparticuz:", e);
    }

    process.env.LD_LIBRARY_PATH = `${execDir}:${execDir}/lib:/tmp:/tmp/lib:${sparticuzBin}:${process.env.LD_LIBRARY_PATH || ''}`;

    launchOptions = {
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
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
      for (const p of paths) {
        if (fs.existsSync(p)) {
          launchOptions.executablePath = p;
          break;
        }
      }
    }
  }

  return await puppeteer.launch(launchOptions);
}

function cleanupChromiumFiles() {
  const paths = [
    '/tmp/chromium',
    '/tmp/al2',
    '/tmp/al2023',
    '/tmp/fonts',
    '/tmp/swiftshader'
  ];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const stats = fs.statSync(p);
        if (stats.isDirectory()) {
          fs.rmSync(p, { recursive: true, force: true });
        } else {
          fs.unlinkSync(p);
        }
        console.log(`Cleaned up path: ${p}`);
      }
    } catch (e) {
      console.error(`Error cleaning up path ${p}:`, e);
    }
  }
}

async function getBrowserInstance(retryCount = 0) {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (launchPromise) {
    try {
      return await launchPromise;
    } catch (err) {
      // If the cached promise rejected, reset it and try again
      launchPromise = null;
    }
  }

  launchPromise = performLaunch();

  try {
    const browser = await launchPromise;
    browserInstance = browser;
    return browser;
  } catch (err) {
    console.error(`Launch failed (attempt ${retryCount + 1}): ${err.message}`);
    
    // Reset global references
    launchPromise = null;
    browserInstance = null;

    if (retryCount < 1) {
      console.log("Attempting cleanup and retry...");
      cleanupChromiumFiles();
      return await getBrowserInstance(retryCount + 1);
    }
    
    throw err;
  }
}

module.exports = async (req, res) => {
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
  let page = null;
  try {
    try {
      browser = await getBrowserInstance();
      page = await browser.newPage();
    } catch (launchOrPageErr) {
      console.error(`Initial browser use failed: ${launchOrPageErr.message}. Resetting browser instance and retrying...`);
      browserInstance = null;
      launchPromise = null;
      
      browser = await getBrowserInstance();
      page = await browser.newPage();
    }

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
    await page.close();
    page = null;

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
    
    // Clean up page if it failed
    if (page) {
      try {
        await page.close();
      } catch (e) {}
    }
    
    // Reset instance if browser crashed/disconnected
    if (err.message.includes('disconnected') || err.message.includes('Session closed')) {
      browserInstance = null;
      launchPromise = null;
    }
    
    return res.status(500).json({ error: `Erro na consulta da placa: ${err.message}` });
  }
};
