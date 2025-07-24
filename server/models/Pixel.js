const mongoose = require('mongoose');

const pixelSchema = new mongoose.Schema({
  coordinates: {
    x: { type: Number, required: true, min: 0, max: 990 },
    y: { type: Number, required: true, min: 0, max: 990 }
  },
  owner: {
    email: { type: String, required: true, match: /.+\@.+\..+/ },
    name: String
  },
  content: {
    url: { type: String, required: true },
    title: String,
    imagePath: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Koordinatlar için unique index
pixelSchema.index({ 'coordinates.x': 1, 'coordinates.y': 1 }, { unique: true });

module.exports = mongoose.model('Pixel', pixelSchema);