// =====================
// Imports
// =====================
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const { getDatabaseHealth } = connectDB;
const authRoutes = require('./routes/authRoutes');
const domainRoutes = require('./routes/domainRoutes');
const mapRoutes = require('./routes/mapRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { mapsLimiter } = require('./middlewares/rateLimiters');
const { MAX_JSON_BODY } = require('./utils/verificationConstants');
const logger = require('./utils/fileLogger');

// =====================
// Required environment
// =====================
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy backend/.env.example to backend/.env and set your MongoDB URI and JWT secret.'
  );
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:5176',
  'http://127.0.0.1:5176',
];
const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultOrigins;
const adminPortalOrigins = process.env.ADMIN_PORTAL_ORIGIN
  ? process.env.ADMIN_PORTAL_ORIGIN.split(',').map((origin) => origin.trim())
  : [];
const superAdminPortalOrigins = process.env.SUPER_ADMIN_PORTAL_ORIGIN
  ? process.env.SUPER_ADMIN_PORTAL_ORIGIN.split(',').map((origin) => origin.trim())
  : [];
const allowedOrigins = [
  ...new Set([...clientOrigins, ...adminPortalOrigins, ...superAdminPortalOrigins]),
];

const isLocalDevOrigin = (origin) => {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
  } catch {
    return false;
  }
};

const isVercelOrigin = (origin) => {
  if (!origin) return false;
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Production + preview deploys on Vercel (branch URLs change per push)
  if (isVercelOrigin(origin)) return true;
  // Vite picks 5174, 5175, … when 5173 is already in use
  if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) return true;
  return false;
};

// =====================
// Express setup
// =====================
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: MAX_JSON_BODY }));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('http.request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    });
  });
  next();
});

// =====================
// Routes
// =====================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'JunkShop On-The-Go API is running',
  });
});

app.get('/api/health', async (req, res) => {
  const database = await getDatabaseHealth();

  res.status(database.ok ? 200 : 503).json({
    status: database.ok ? 'ok' : 'degraded',
    database: database.state,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsLimiter, mapRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/system', systemRoutes);
app.use('/api', domainRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large.' });
  }

  if (err.status === 429) {
    return res.status(429).json({ message: 'Too many requests. Please try again later.' });
  }

  console.error(err);
  logger.error('http.unhandled_error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(err.status || 500).json({
    message: isProduction ? 'Something went wrong.' : err.message || 'Something went wrong.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// =====================
// Start
// =====================
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`CORS allowed for: ${clientOrigins.join(', ')}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS also allows any http://localhost / 127.0.0.1 port in development');
    }
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  logger.error('server.start_failed', err);
  process.exit(1);
});
