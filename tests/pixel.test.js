const app = require('../server/server');
const request = require('supertest');
const DrawPixel = require('../server/models/DrawPixel');
const mongoose = require('mongoose');

const testDrawPixel = {
  x: 10,
  y: 10,
  color: '#ff0000'
};

describe('Draw API', () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI_TEST);
    } catch (err) {
      console.error('MongoDB bağlantı hatası:', err);
    }
  });

  beforeEach(async () => {
    await DrawPixel.deleteMany();
  });

  test('POST /api/draw - Yeni pixel çizme', async () => {
    const res = await request(app)
      .post('/api/draw')
      .send(testDrawPixel);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.color).toBe('#ff0000');
  });

  test('GET /api/draw - Tüm pikselleri getir', async () => {
    // Önce bir pixel oluştur
    await request(app)
      .post('/api/draw')
      .send(testDrawPixel);

    const res = await request(app)
      .get('/api/draw');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('DELETE /api/draw - Tuvali temizle', async () => {
    // Önce bir pixel oluştur
    await request(app)
      .post('/api/draw')
      .send(testDrawPixel);

    const res = await request(app)
      .delete('/api/draw');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Tuval temizlendi');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
