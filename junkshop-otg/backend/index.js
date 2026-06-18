// =====================
// Imports
// =====================
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const domainRoutes = require('./routes/domainRoutes');
const mapRoutes = require('./routes/mapRoutes');

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
];
const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultOrigins;

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
  if (clientOrigins.includes(origin)) return true;
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
app.use(express.json());

// =====================
// Routes
// =====================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'JunkShop On-The-Go API is running',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api', domainRoutes);

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
  process.exit(1);
});
