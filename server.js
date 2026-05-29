const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const handler = require('./api/consulta-placa.js');

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Servir API do Vercel
  if (pathname === '/api/consulta-placa') {
    const mockReq = {
      method: req.method,
      query: parsedUrl.query,
      headers: req.headers
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
      end(data) {
        res.end(data);
      }
    };

    try {
      await handler(mockReq, mockRes);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
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
