const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const productRoutes = require('./routes/products.route'); // <-- relative path correct
app.use('/products', productRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Backend is running! 🔥');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
