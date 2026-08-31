module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let imageUrl = null;
  let base64Image = null;

  if (req.method === 'GET') {
    imageUrl = req.query?.url || req.query?.imageUrl || req.query?.upload_url;
  } else if (req.method === 'POST') {
    const body = req.body || {};
    imageUrl = body.imageUrl || body.url || body.upload_url;
    base64Image = body.base64 || body.image;
  }

  if (!imageUrl && !base64Image) {
    return res.status(400).json({ error: 'URL ou imagem não fornecida para leitura de OCR' });
  }

  const token = process.env.PLATE_RECOGNIZER_TOKEN || 'a33bd85cd7ff2f67b44b390d9d0ba90d305840ab';
  const apiUrl = 'https://api.platerecognizer.com/v1/plate-reader/';

  try {
    const formData = new FormData();
    formData.append('regions', 'br');

    let imageBuffer = null;
    let fileName = 'plate.jpg';
    let mimeType = 'image/jpeg';

    if (base64Image) {
      const match = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        imageBuffer = Buffer.from(base64Image, 'base64');
      }
    } else if (imageUrl) {
      // Baixa os bytes da imagem diretamente para enviar via multipart (garante 100% de compatibilidade)
      const imgFetch = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (!imgFetch.ok) {
        throw new Error(`Falha ao baixar imagem para OCR: status ${imgFetch.status}`);
      }
      const arrayBuf = await imgFetch.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
      const ct = imgFetch.headers.get('content-type');
      if (ct) mimeType = ct;
    }

    formData.append('upload', new Blob([imageBuffer], { type: mimeType }), fileName);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro retornado pelo Plate Recognizer:', response.status, errText);
      return res.status(response.status).json({ 
        error: `Erro no serviço de OCR (${response.status}): ${errText}` 
      });
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const bestResult = data.results[0];
      const rawPlate = (bestResult.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (rawPlate.length >= 6) {
        return res.status(200).json({
          success: true,
          plate: rawPlate,
          confidence: bestResult.score || bestResult.confidence || 0,
          vehicle_type: bestResult.vehicle?.type || null
        });
      }
    }

    return res.status(200).json({
      success: false,
      error: 'Nenhuma placa reconhecida com clareza na imagem.'
    });

  } catch (err) {
    console.error('Exceção ao consultar Plate Recognizer:', err);
    return res.status(500).json({ error: 'Erro interno ao processar OCR da placa: ' + err.message });
  }
};
