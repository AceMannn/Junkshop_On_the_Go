const mongoose = require('mongoose');

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

module.exports = connectDB;