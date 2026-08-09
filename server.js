require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const authRoutes = require('./src/routes/authRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const { errorHandler } = require('./src/middleware/errorHandler');
const setupSwagger = require('./src/config/swagger');
const redoc = require('redoc-express');
const swaggerSpec = require('./src/config/swagger');
const { apiReference } = require('@scalar/express-api-reference');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ----------------------------------------------------
// 1. CRIAÇÃO DOS SUB-APLICATIVOS EXPRESS
// ----------------------------------------------------
const docsApp = express();
const mainApp = express();

// Middleware Global de Injeção de favicon/head (Modificado para funcionar em ambos)
const globalHeadInject = (req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string' && (body.includes('<!DOCTYPE html>') || body.includes('<html'))) {
      const globalHeadTags = `
        <title>API Documentation</title>
        <link rel="icon" href="https://luxjson.is-a.dev/favicon.ico" />
      `;
      if (body.includes('<head>')) {
        body = body.replace('<head>', `<head>\n${globalHeadTags}`);
      }
    }
    return originalSend.call(this, body);
  };
  next();
};

docsApp.use(globalHeadInject);
mainApp.use(globalHeadInject);

// Configurações Globais Compartilhadas (CORS, Helmet, BodyParsers)
const allowedOrigins = [
  'https://luxjson.is-a.dev',
  'https://api.luxjson.is-a.dev',
  'https://luxjson.github.io',
  'http://localhost:5173',
  'http://localhost:5000',
];

const corsOptions = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueou: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
    },
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://luxjson.up.railway.app", "https://docs.luxjson.up.railway.app"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar segurança básicos e parsers em ambas as sub-apps
[mainApp, docsApp].forEach((subApp) => {
  subApp.use(corsOptions);
  subApp.use(helmetConfig);
  subApp.use(hpp());
  subApp.use(compression());
  subApp.use(limiter);
  subApp.use(express.json({ limit: '10mb' }));
  subApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
  if (!isProduction) {
    subApp.use(morgan('dev'));
  } else {
    subApp.use(morgan('combined'));
  }
});

mainApp.use(express.static('public'));

// ----------------------------------------------------
// 2. ROTAS EXCLUSIVAS DO SUBDOMÍNIO (docsApp)
// ----------------------------------------------------
// Agora o Scalar roda direto na raiz '/' do subdomínio docs.luxjson.up.railway.app
docsApp.use(
  '/',
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: 'purple',
    pageTitle: 'API Documentation | LUXJSON',
    favicon: 'https://luxjson.is-a.dev/favicon.ico',
    showDeveloperTools: "never"
  })
);

// ----------------------------------------------------
// 3. ROTAS DO DOMÍNIO PRINCIPAL (mainApp)
// ----------------------------------------------------
mainApp.use('/api/auth', authRoutes);
mainApp.use('/api/blog', blogRoutes);

mainApp.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

mainApp.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

mainApp.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>API Documentation</title>
        <link rel="icon" href="https://luxjson.is-a.dev/favicon.ico" />
        <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <div class="container">
          <div class="card">
            <img src="https://luxjson.is-a.dev/favicon.png" style="width: 100px; height: 100px; border-radius: 50%;" class="avatar" />
            <p>API running on <strong>${isProduction ? 'production' : 'development'} mode</strong>.</p>
            <!-- Redireciona o usuário para o subdomínio correto -->
            <a class="btn" href="https://docs.luxjson.up.railway.app">View Documentation</a>
          </div>

          <div class="endpoints-list">
            <h3>Endpoints</h3>
            <ul id="routes">
              <p style="color: var(--scalar-color-2); font-size: 13px;">Loading...</p>
            </ul>
          </div>
        </div>

        <script>
          fetch('/swagger.json')
            .then(res => res.json())
            .then(data => {
              const list = document.getElementById('routes');
              list.innerHTML = '';
              for (const [path, methods] of Object.entries(data.paths)) {
                for (const method of Object.keys(methods)) {
                  const li = document.createElement('li');
                  const spanMethod = document.createElement('span');
                  spanMethod.className = 'method ' + method.toLowerCase();
                  spanMethod.innerText = method;
                  const a = document.createElement('a');
                  a.className = 'endpoint-link';
                  a.href = path;
                  a.target = '_blank';
                  a.innerText = path;
                  li.appendChild(spanMethod);
                  li.appendChild(a);
                  list.appendChild(li);
                }
              }
            })
            .catch(() => {
              document.getElementById('routes').innerHTML = '<p style="color: #f87171; font-size: 13px;"> Failed to fetch routes.</p>';
            });
        </script>
      </body>
    </html>
  `);
});

// Tratamento de Erros e 404 em cada App individualmente
[mainApp, docsApp].forEach((subApp) => {
  subApp.use((req, res) => {
    res.status(404).json({ success: false, message: `Rota não encontrada: ${req.method} ${req.url}` });
  });
  subApp.use(errorHandler);
});

// ----------------------------------------------------
// 4. ROTEADOR DE SUBDOMÍNIOS (MIDDLEWARE CENTRAL)
// ----------------------------------------------------
app.use((req, res, next) => {
  const host = req.headers.host || '';
  
  // Captura requisições para o subdomínio docs
  if (host.startsWith('docs.luxjson.up.railway.app') || host.startsWith('docs.localhost')) {
    return docsApp(req, res, next);
  }
  
  // Qualquer outro host cai na aplicação padrão/principal
  return mainApp(req, res, next);
});

// Processos Globais de Saída
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  if (isProduction) process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promessa rejeitada:', reason);
  if (isProduction) process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS: ${isProduction ? 'Restrito' : 'Todas origens (DEV)'}`);
});
