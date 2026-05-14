const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // 👈 ADD
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productRoutes = require('./routes/products.route');
app.use('/products', productRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Backend is running! 🔥');
});

// 🔥 CONNECT TO MONGODB FIRST
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected 🔥');

    // Start server ONLY after DB connects
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });