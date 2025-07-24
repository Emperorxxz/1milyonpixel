const express = require('express');
const Pixel = require('../models/Pixel');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Koordinat çakışması kontrolü
    const existingPixel = await Pixel.findOne({
      'coordinates.x': req.body.coordinates.x,
      'coordinates.y': req.body.coordinates.y
    });
    
    if (existingPixel) {
      return res.status(400).json({ 
        error: 'Bu koordinatlar zaten kullanımda' 
      });
    }

    const pixel = new Pixel(req.body);
    await pixel.save();
    res.status(201).json(pixel);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Koordinat çakışması' });
    }
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const pixels = await Pixel.find().lean();
    res.json(pixels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;