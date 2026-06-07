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
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const clientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : defaultOrigins;

// =====================
// Express setup
// =====================
const app = express();

app.use(
  cors({
    origin: clientOrigins,
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
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
