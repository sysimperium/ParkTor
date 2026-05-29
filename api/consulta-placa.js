// Force AWS environment variables for Vercel Serverless environment
// so that @sparticuz/chromium correctly identifies the runtime and extracts system libraries
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  const nodeVersion = process.version;
  console.log(`Setting up AWS environment variables for Vercel Node runtime: ${nodeVersion}`);
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion >= 20) {
    process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs20.x';
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs20.x';
  } else {
    process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';
    process.env.AWS_LAMBDA_JS_RUNTIME = 'nodejs18.x';
  }
}

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

  const urls = [
    { name: 'qualveiculo', url: 'https://www.qualveiculo.net/placa/mlg5736' },
    { name: 'qualveiculo_slash', url: 'https://www.qualveiculo.net/placa/mlg5736/' },
    { name: 'placaon', url: 'https://www.placaon.com.br/consultar-placa/MLG5736' },
    { name: 'placadoscarros', url: 'https://www.placadoscarros.com.br/placa/MLG5736' },
    { name: 'infoplaca', url: 'https://www.infoplaca.com.br/placa/MLG5736' }
  ];

  let browser = null;
  const results = {};

  try {
    browser = await getBrowserInstance();
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7" });

    for (const target of urls) {
      try {
        console.log(`Testing target: ${target.name}`);
        const response = await page.goto(target.url, {
          waitUntil: "networkidle2",
          timeout: 10000
        });
        const html = await page.content();
        const $ = cheerio.load(html);
        results[target.name] = {
          status: response ? response.status() : null,
          title: $('title').text().trim(),
          snippet: $('body').text().trim().replace(/\s+/g, ' ').substring(0, 1000),
          url: page.url()
        };
      } catch (err) {
        results[target.name] = { error: err.message };
      }
    }
    await page.close();
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: err.message, results });
  }
};
