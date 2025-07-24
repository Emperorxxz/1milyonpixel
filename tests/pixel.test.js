const app = require('../server/server');
const request = require('supertest');
const Pixel = require('../server/models/Pixel');
const mongoose = require('mongoose');

describe('Pixel API', () => {
  let server;
  let testPixelId;

  beforeAll(async () => {
    // Test veritabanına bağlan
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Test verisini oluştur
    const pixel = await Pixel.create({
      coordinates: { x: 10, y: 10 },
      owner: { email: 'test@example.com' },
      content: { url: 'https://example.com' }
    });
    testPixelId = pixel._id;
  });

  afterAll(async () => {
    // Bağlantıları temizle
    await Pixel.deleteMany();
    await mongoose.disconnect();
  });

  test('GET /api/pixels - Pikselleri listeleme', async () => {
    const res = await request(app).get('/api/pixels');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  test('POST /api/pixels - Yeni piksel oluşturma', async () => {
    const res = await request(app)
      .post('/api/pixels')
      .send({
        coordinates: { x: 20, y: 20 },
        owner: { email: 'test2@example.com' },
        content: { url: 'https://example2.com' }
      });
    expect(res.status).toBe(201);
  });
});