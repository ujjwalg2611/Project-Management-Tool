const mongoose = require('mongoose');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/pm-app';
    await mongoose.connect(uri);
    console.log(`[db] connected -> ${uri}`);
  } catch (err) {
    console.error('[db] connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
