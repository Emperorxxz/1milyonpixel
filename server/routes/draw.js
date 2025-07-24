const express = require('express');
const DrawPixel = require('../models/DrawPixel');
const router = express.Router();

// Pixel çizme
router.post('/', async (req, res) => {
  try {
    const { x, y, color } = req.body;
    
    // Mevcut pixel varsa güncelle, yoksa oluştur
    const pixel = await DrawPixel.findOneAndUpdate(
      { x, y },
      { color },
      { upsert: true, new: true }
    );
    
    res.json(pixel);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Tüm pikselleri getir
router.get('/', async (req, res) => {
  try {
    const pixels = await DrawPixel.find().lean();
    res.json(pixels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tuvali temizle
router.delete('/', async (req, res) => {
  try {
    await DrawPixel.deleteMany({});
    res.json({ message: 'Tuval temizlendi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
