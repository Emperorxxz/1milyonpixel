const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server/server');
const Pixel = require('../server/models/Pixel');

// Test veritabanı bağlantısını global olarak yönetmek için
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) { // Sadece bağlantı yoksa bağlan
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb+srv://ahmetbasboga85:SANANEYARRAM0@cluster0.bvg24bu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/pixelDB_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
});

afterEach(async () => {
  await Pixel.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Pixel API Endpoints', () => {
  test('POST /api/pixels - Yeni piksel oluşturma', async () => {
    const res = await request(app)
      .post('/api/pixels')
      .send({
        coordinates: { x: 10, y: 10 },
        owner: { email: 'test@example.com' },
        content: { url: 'https://example.com' }
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
  });

  test('GET /api/pixels - Pikselleri listeleme', async () => {
    await Pixel.create({
      coordinates: { x: 10, y: 10 },
      owner: { email: 'test@example.com' },
      content: { url: 'https://example.com' }
    });

    const res = await request(app).get('/api/pixels');
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(1);
  });
});