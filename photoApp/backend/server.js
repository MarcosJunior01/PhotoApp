require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const upload = multer({ dest: 'temp_uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do Cloudinary usando variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Endpoint para upload
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const tempPath = req.file.path;
  const molduraPath = req.body.moldura; // Recebe o caminho da moldura
  let combinedPath;

  try {
    // Carrega a imagem enviada
    const foto = await loadImage(tempPath);
    const canvas = createCanvas(foto.width, foto.height);
    const ctx = canvas.getContext('2d');

    // Desenha a foto original
    ctx.drawImage(foto, 0, 0, foto.width, foto.height);

    // Aplica a moldura se existir
    if (molduraPath) {
      try {
        // Verifica se o arquivo da moldura existe
        const fullMolduraPath = path.join(__dirname, 'public', molduraPath);
        if (!fs.existsSync(fullMolduraPath)) {
          console.warn(`Arquivo de moldura não encontrado: ${fullMolduraPath}`);
        } else {
          const moldura = await loadImage(fullMolduraPath);
          ctx.drawImage(moldura, 0, 0, foto.width, foto.height);
        }
      } catch (molduraError) {
        console.error('Erro ao carregar moldura:', molduraError);
        // Continua sem moldura se houver erro
      }
    }

    // Salva temporariamente a imagem combinada
    combinedPath = path.join(__dirname, 'temp_uploads', `combined_${Date.now()}.jpg`);
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    fs.writeFileSync(combinedPath, buffer);

    // Upload para Cloudinary
    const result = await cloudinary.uploader.upload(combinedPath, {
      folder: 'imagens',
      format: 'jpg'
    });

    // Gera QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(result.secure_url);

    res.json({ 
      url: result.secure_url,
      qrCodeDataUrl
    });

  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ 
      error: 'Erro ao processar imagem',
      details: err.message 
    });
  } finally {
    // Limpeza dos arquivos temporários
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (combinedPath && fs.existsSync(combinedPath)) fs.unlinkSync(combinedPath);
    } catch (cleanupError) {
      console.error('Erro ao limpar arquivos temporários:', cleanupError);
    }
  }
});

// Garante que o diretório temp_uploads existe
const tempDir = path.join(__dirname, 'temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});