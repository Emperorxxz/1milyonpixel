process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/pixelDB_test';

// Test veritabanını temizle
const mongoose = require('mongoose');
const Pixel = require('../server/models/Pixel');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Pixel.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});