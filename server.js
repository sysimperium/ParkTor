const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const handlerConsulta = require('./api/consulta-placa.js');
const handlerOcr = require('./api/ocr-placa.js');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Servir APIs dinâmicas da pasta /api/
  if (pathname.startsWith('/api/')) {
    const apiName = pathname.replace('/api/', '').split('/')[0];
    const apiFile = path.join(__dirname, 'api', `${apiName}.js`);

    if (fs.existsSync(apiFile)) {
      let body = {};
      if (req.method === 'POST') {
        try {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          const rawBody = Buffer.concat(buffers).toString();
          if (rawBody) {
            body = JSON.parse(rawBody);
          }
        } catch (e) {
          console.error('Erro ao ler body JSON:', e);
        }
      }

      const mockReq = {
        method: req.method,
        query: parsedUrl.query,
        headers: req.headers,
        body: body
      };

      const mockRes = {
        statusCode: 200,
        headers: {},
        setHeader(name, val) {
          this.headers[name] = val;
          res.setHeader(name, val);
        },
        status(code) {
          this.statusCode = code;
          res.statusCode = code;
          return this;
        },
        json(data) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(data));
          return this;
        },
        send(data) {
          res.end(data);
          return this;
        },
        end(data) {
          res.end(data);
        }
      };

      try {
        const handler = require(apiFile);
        await handler(mockReq, mockRes);
      } catch (err) {
        console.error(`Erro na rota ${pathname}:`, err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // Servir arquivos estáticos
  let filePath = path.join(__dirname, pathname === '/' ? 'entrada.html' : pathname);

  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';

    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Servidor local do ParkTor rodando com sucesso!`);
  console.log(`Acesse no navegador: http://localhost:${PORT}/entrada.html`);
  console.log(`==================================================\n`);
});
