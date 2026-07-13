# LuxJSON Backend

Backend para o site LuxJSON, com autenticação JWT e gerenciamento de blog.

## 🚀 Deploy

### Opção 1: Render
1. Crie uma conta no [Render](https://render.com)
2. Conecte seu repositório
3. Configure:
   - Build Command: 
pm install
   - Start Command: 
pm start
4. Adicione as variáveis de ambiente (veja .env)

### Opção 2: Railway
1. Crie uma conta no [Railway](https://railway.app)
2. Conecte seu repositório
3. Adicione as variáveis de ambiente

### Opção 3: Fly.io
1. Instale o flyctl
2. Execute ly launch
3. Configure as variáveis de ambiente

## 📦 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| PORT | Porta do servidor |
| DATABASE_URL | Conexão com Neon PostgreSQL |
| JWT_SECRET | Chave secreta para JWT |
| NODE_ENV | development ou production |
| FRONTEND_URL | URL do frontend (GitHub Pages) |

## 🔐 Rotas

### POST /api/auth/login
Login do administrador.

**Corpo:**
\\\json
{
  "username": "admin",
  "password": "admin123"
}
\\\

**Resposta:**
\\\json
{
  "success": true,
  "token": "jwt_token",
  "admin": { "id": 1, "username": "admin" }
}
\\\

### GET /api/auth/me
Obtém dados do administrador logado (requer token no header).

## 🛠️ Desenvolvimento

\\\ash
npm install
npm run dev
\\\

---

Criado com ❤️ para LuxJSON
