require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'suporte-jwt-photoapp-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Importar conexão e funções do banco de dados
const pool = require('./db');
const db = require('./queries');

const app = express();
const upload = multer({ dest: 'temp_uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Middleware para logging de requisições
app.use((req, res, next) => {
  res.on('finish', async () => {
    try {
      const userId = req.user?.id || null;
      const ip = req.ip || req.connection.remoteAddress;
      await db.createLog(userId, ip, req.path, req.method, req.body, res.statusCode);
    } catch (err) {
      console.error('Erro ao criar log:', err.message);
    }
  });
  next();
});

// Configuração do Cloudinary usando variáveis de ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==================== AUTENTICAÇÃO ====================

// Helper para hash de senha
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    req.user = payload;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Admin apenas.' });
  }
  next();
};

// ==================== ENDPOINTS DE AUTENTICAÇÃO ====================

// POST /auth/register - Registrar novo usuário
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Verifica se o usuário já existe
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Cria o usuário
    const hashedPassword = hashPassword(password);
    const user = await db.createUser(name, email, hashedPassword, role || 'promotor');

    // Retorna o usuário sem a senha
    const { password_hash, ...safeUser } = user;
    res.status(201).json({ message: 'Usuário criado com sucesso', user: safeUser });

  } catch (err) {
    console.error('Erro ao registrar usuário:', err.message);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// POST /auth/login - Fazer login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const hashedPassword = hashPassword(password);
    if (user.password_hash !== hashedPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ 
      message: 'Login realizado com sucesso',
      token,
      user: safeUser
    });

  } catch (err) {
    console.error('Erro ao fazer login:', err.message);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ==================== ENDPOINT DE UPLOAD ====================

// Endpoint para upload de foto
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const tempPath = req.file.path;
  const molduraPath = req.body.moldura;
  const userId = req.body.userId || null; // Recebe o ID do usuário (opcional)
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
        const fullMolduraPath = path.join(__dirname, 'public', molduraPath);
        if (!fs.existsSync(fullMolduraPath)) {
          console.warn(`Arquivo de moldura não encontrado: ${fullMolduraPath}`);
        } else {
          const moldura = await loadImage(fullMolduraPath);
          ctx.drawImage(moldura, 0, 0, foto.width, foto.height);
        }
      } catch (molduraError) {
        console.error('Erro ao carregar moldura:', molduraError);
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

    // Salva a foto no banco de dados
    const photo = await db.savePhoto(result.secure_url, result.public_id, userId);

    // Gera QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(result.secure_url);

    res.json({ 
      message: 'Foto enviada com sucesso',
      url: result.secure_url,
      public_id: result.public_id,
      photoId: photo.id,
      qrCodeDataUrl
    });

  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ 
      error: 'Erro ao processar imagem',
      details: err.message 
    });
  } finally {
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

// ==================== ENDPOINTS DE FOTOS ====================

// GET /photos - Buscar todas as fotos
app.get('/photos', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const result = await db.getAllPhotosPaginated(offset, limit);
    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar fotos:', err.message);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

// GET /photos/:userId - Buscar fotos de um usuário
app.get('/photos/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const photos = await db.getPhotosByUserId(userId);
    res.json({ photos });
  } catch (err) {
    console.error('Erro ao buscar fotos do usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar fotos' });
  }
});

// ==================== ENDPOINTS DE LOGS ====================

// GET /admin/logs - Buscar todos os logs (requer autenticação)
app.get('/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 25,
      route: req.query.route,
      method: req.query.method,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortField: req.query.sortField,
      sortDir: req.query.sortDir
    };

    const result = await db.getLogsFiltered(filters);
    res.json(result);
  } catch (err) {
    console.error('Erro ao buscar logs:', err.message);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

// GET /admin/logs/:userId - Buscar logs de um usuário (requer autenticação)
app.get('/admin/logs/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await db.getLogsByUserId(userId);
    res.json({ logs });
  } catch (err) {
    console.error('Erro ao buscar logs do usuário:', err.message);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

// DELETE /admin/logs/:id — apagar um log
app.delete('/admin/logs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await db.deleteLogById(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Log não encontrado' });
    res.json({ message: 'Log apagado com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao apagar log' });
  }
});

// DELETE /admin/logs — apagar múltiplos ou todos
app.delete('/admin/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { ids, all } = req.body;
    if (all) {
      const count = await db.deleteAllLogs();
      return res.json({ message: `${count} logs apagados` });
    }
    if (!ids || !ids.length) return res.status(400).json({ error: 'Nenhum ID informado' });
    const deleted = await db.deleteLogsByIds(ids);
    res.json({ message: `${deleted.length} logs apagados` });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao apagar logs' });
  }
});
// ==================== ENDPOINT QR CODE ====================

// GET /admin/stats - Estatísticas do admin
app.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total de fotos
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM photos');
    const totalPhotos = parseInt(totalResult.rows[0].total);

    // Fotos hoje
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const todayResult = await pool.query(
      'SELECT COUNT(*) as today FROM photos WHERE created_at >= $1 AND created_at < $2',
      [startOfDay, endOfDay]
    );
    const todayPhotos = parseInt(todayResult.rows[0].today);

    res.json({ totalPhotos, todayPhotos });
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err.message);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.get('/admin/qrcode', async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.hostname}:3000`;
    const adminUrl = `${frontendUrl.replace(/\/$/, '')}/admin/login`;
    const qrCodeDataUrl = await QRCode.toDataURL(adminUrl, {
      width: 300,
      margin: 2,
    });
    res.json({ qrCodeDataUrl });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
});

app.get('/admin/qrcode/photo/:photoId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { photoId } = req.params;
    
    // Buscar a foto no banco para obter a URL do Cloudinary
    const photo = await db.getPhotoById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    // Usar a URL do Cloudinary salva no banco
    const qrCodeDataUrl = await QRCode.toDataURL(photo.url, {
      width: 300,
      margin: 2,
    });
    res.json({ qrCodeDataUrl });
  } catch (err) {
    console.error('Erro ao gerar QR Code da foto:', err);
    res.status(500).json({ error: 'Erro ao gerar QR Code da foto' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==================== INICIALIZAR SERVIDOR ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(` Servidor rodando na porta ${PORT}`);
  console.log(` Frontend: ${process.env.FRONTEND_URL}`);
});