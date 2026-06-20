const mongoose = require('mongoose');

const STATE_LABELS = ['disconnected', 'connected', 'connecting', 'disconnecting'];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.error(
      'Check MONGO_URI in backend/.env — use mongodb://127.0.0.1:27017/junkshop_otg for local MongoDB, or your Atlas connection string.'
    );
    process.exit(1);
  }
};

const getDatabaseHealth = async () => {
  const readyState = mongoose.connection.readyState;

  if (readyState !== 1) {
    return {
      ok: false,
      state: STATE_LABELS[readyState] || 'unknown',
    };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return { ok: true, state: 'connected' };
  } catch (error) {
    return {
      ok: false,
      state: 'ping_failed',
    };
  }
};

module.exports = connectDB;
module.exports.getDatabaseHealth = getDatabaseHealth;