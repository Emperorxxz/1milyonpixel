const express = require('express');
const Pixel = require('../models/Pixel');
const validate = require('../middleware/validatePixel');
const router = express.Router();

// Piksel satın alma
router.post('/', validate, async (req, res) => {
  try {
    // Çakışma kontrolü
    const existingPixel = await Pixel.findOne({
      'coordinates.x': req.body.coordinates.x,
      'coordinates.y': req.body.coordinates.y
    });
    
    if (existingPixel) {
      return res.status(409).json({ error: 'Bu koordinatlar zaten dolu!' });
    }

    const pixel = new Pixel(req.body);
    await pixel.save();
    res.status(201).json(pixel);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Tüm pikselleri getir (optimize edilmiş)
router.get('/', async (req, res) => {
  const pixels = await Pixel.find()
    .select('coordinates size content.url')
    .lean();
  res.json(pixels);
});

module.exports = router;