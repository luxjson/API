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

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  'https://luxjson.is-a.dev',
  'https://luxjson.github.io',
  'http://localhost:5173', 
  'http://localhost:5000', 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(hpp());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', limiter);
app.use('/api/auth', limiter);
app.use('/api/blog', limiter);

if (!isProduction) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
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