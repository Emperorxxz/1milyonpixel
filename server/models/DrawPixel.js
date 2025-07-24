const mongoose = require('mongoose');

const drawPixelSchema = new mongoose.Schema({
  x: { type: Number, required: true, min: 0, max: 99 },
  y: { type: Number, required: true, min: 0, max: 99 },
  color: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
  createdAt: { type: Date, default: Date.now }
});

// Koordinatlar için unique index
drawPixelSchema.index({ x: 1, y: 1 }, { unique: true });

module.exports = mongoose.model('DrawPixel', drawPixelSchema);
