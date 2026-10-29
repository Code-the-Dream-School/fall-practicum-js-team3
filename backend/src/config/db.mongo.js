const mongoose = require('mongoose');

const connectMongo = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured to use project persistence.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');
};

module.exports = connectMongo;
