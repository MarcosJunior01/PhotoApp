# 📸 PhotoApp

Sistema de totem fotográfico com painel administrativo, autenticação por roles, upload com moldura e geração de QR Code.

---

## 🗂️ Estrutura do Projeto

```
PhotoApp/
├── frontend/app/
│   └── src/
│       ├── components/
│       │   ├── CameraFlow.jsx
│       │   ├── AdminPanel.jsx
│       │   └── screens/
│       │       ├── LoginScreen.jsx       ← Admin
│       │       ├── LoginLocalScreen.jsx  ← Promotor
│       │       ├── HomeScreen.jsx
│       │       ├── QRCodeScreen.jsx
│       │       ├── MolduraSelection.jsx
│       │       ├── LogsPanel.jsx
│       │       └── RegisterUser.jsx
│       └── App.js
└── backend/
    ├── server.js
    ├── queries.js
    ├── db.js
    └── .env
```

---

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` dentro de `backend/`:

```env
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://192.168.x.x:3000 <-- SUPER IMPORTANTE VERIFICAR
PORT=3001
JWT_SECRET=sua-chave-secreta
JWT_EXPIRES_IN=8h
```

---

## 🚀 Inicialização

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend/app
npm install
npm start
```

---

## 🗄️ Banco de Dados (PostgreSQL)

### Tabela: `users`
```sql
CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100)        NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT               NOT NULL,
  role         VARCHAR(20)         NOT NULL DEFAULT 'promotor',
  created_at   TIMESTAMP           DEFAULT NOW()
);
```

### Tabela: `photos`
```sql
CREATE TABLE photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url        TEXT    NOT NULL,
  public_id  TEXT    NOT NULL,
  user_id    UUID    REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `logs`
```sql
CREATE TABLE logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  ip          VARCHAR(45),
  route       TEXT,
  method      VARCHAR(10),
  body        JSONB,
  status_code INTEGER,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Autenticação

### Roles disponíveis
| Role | Acesso |
|------|--------|
| `admin` | Painel admin, logs, cadastro de usuários |
| `promotor` | Totem (câmera, moldura, upload) |

### Criar usuário inicial (admin)
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador",
    "email": "admin@photoapp.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@photoapp.com",
    "password": "admin123"
  }'
```

Retorna um `token` JWT que deve ser enviado no header `Authorization: Bearer <token>` nas rotas protegidas.

---

## 📡 Endpoints da API

### Autenticação
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/auth/register` | Não | Registrar usuário |
| POST | `/auth/login` | Não | Login |

### Fotos
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| POST | `/upload` | Não | Upload com moldura |
| GET | `/photos` | Não | Todas as fotos (paginado) |
| GET | `/photos/:userId` | Não | Fotos de um usuário |

### Admin
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/admin/stats` | Admin | Estatísticas gerais |
| GET | `/admin/logs` | Admin | Logs filtrados e paginados |
| DELETE | `/admin/logs` | Admin | Apagar logs (`{ ids: [...] }` ou `{ all: true }`) |
| GET | `/admin/qrcode` | Não | QR Code do painel admin |
| GET | `/admin/qrcode/photo/:photoId` | Admin | QR Code de uma foto |

### Utilitários
| Método | Rota | Autenticação | Descrição |
|--------|------|-------------|-----------|
| GET | `/health` | Não | Status do servidor |

---

## 📸 Upload de Foto

```bash
curl -X POST http://localhost:3001/upload \
  -F "image=@foto.jpg" \
  -F "moldura=/molduras/moldura1.png" \
  -F "userId=uuid-do-usuario"
```

**Response:**
```json
{
  "message": "Foto enviada com sucesso",
  "url": "https://res.cloudinary.com/...",
  "photoId": "uuid...",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

---

## 🖥️ Rotas do Frontend

| Path | Componente | Acesso |
|------|-----------|--------|
| `/` | `CameraFlow` → `LoginLocalScreen` | Promotor |
| `/admin/login` | `LoginScreen` | Admin |
| `/admin/panel` | `AdminPanel` | Admin |
| `/admin/logs` | `LogsPanel` | Admin |
| `/admin/usuarios/novo` | `RegisterUser` | Admin |

---

## 🔄 Fluxo de Uso

### Promotor (Totem)
```
LoginLocalScreen → HomeScreen → MolduraSelection → Câmera → Review → Upload → QR Code
```

### Administrador
```
QRCodeScreen (totem) → /admin/login (outro dispositivo) → AdminPanel → Logs / Cadastro

O ADM tem a opção de abrir o painel dentro do totem ou remotamente scaneando o QR Code
```

---

## 🗂️ Painel Administrativo

### AdminPanel (`/admin/panel`)
- Cards de estatísticas: total de fotos, fotos hoje, filtradas
- Grid de fotos com paginação
- Filtros por data e usuário
- Modal com QR Code de cada foto

### LogsPanel (`/admin/logs`)
- Tabela de requisições com sorting e paginação
- Filtros: data, rota, método HTTP, faixa de status (2xx/3xx/4xx/5xx)
- Seleção múltipla de logs para deleção em lote
- Export CSV
- Modal de detalhes por linha

### RegisterUser (`/admin/usuarios/novo`)
- Cadastro de admin ou promotor
- Campos: nome, e-mail, senha, confirmação, role
- Validação inline

---

## 🧾 Logs

O sistema registra automaticamente **todas as requisições** com:
- IP de origem
- Rota e método HTTP
- Body da requisição
- Status code da resposta
- Usuário autenticado (se houver)

---

## 🔒 Segurança

- Senhas armazenadas com hash **SHA-256**
- Autenticação via **JWT** (expira em 8h por padrão)
- Rotas admin protegidas por middleware `authenticateToken` + `requireAdmin`
- Credenciais do "lembrar senha" no frontend armazenadas em **base64** no localStorage

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| `Erro de conexão` no frontend | Verificar se o backend está rodando na porta 3001 |
| `Token inválido ou expirado` | Fazer logout e login novamente |
| `Email já cadastrado` | Usar outro e-mail no cadastro |
| Foto não associada ao usuário | Confirmar que `userId` é enviado no upload |
| Filtro de status nos logs não funciona | Verificar se o fix da faixa (2xx→3xx) foi aplicado em `queries.js` |
| Tela com "sambada" no totem | Confirmar `position: fixed; inset: 0; overflow: hidden` no container |
| Bordas brancas em outras páginas | CSS do admin usa `.ap-root` como escopo — não usa `:root` global |

---

## 📦 Dependências Principais

### Backend
```json
"express", "pg", "jsonwebtoken", "cloudinary", "multer",
"canvas", "qrcode", "cors", "dotenv", "crypto"
```

### Frontend
```json
"react", "react-router-dom", "axios", "react-icons"
```
