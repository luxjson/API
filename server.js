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

const allowedOrigins = [
  'https://luxjson.is-a.dev',
  'https://api.luxjson.is-a.dev',
  'https://luxjson.github.io',
  'http://localhost:5173',
  'http://localhost:5000',
];

app.use(cors({
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
}));

app.use(helmet({
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
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://unpkg.com", 
        "https://cdn.jsdelivr.net"
      ],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://portfoliobackend-production-a9ba.up.railway.app"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
}));



app.use(hpp());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(
  '/docs',
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

if (!isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

app.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <title>API Documentation | LUXJSON</title>
        <link rel="icon" href="https://luxjson.is-a.dev/favicon.ico" />
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <script
          id="api-reference"
          data-url="/swagger.json"
          data-theme="purple"
          data-show-developer-tools="false">
        </script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API LuxJSON rodando!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      blog: '/api/blog/posts',
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota não encontrada: ${req.method} ${req.url}` });
});

app.use(errorHandler);

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