const mongoose = require('mongoose');

const pixelSchema = new mongoose.Schema({
  coordinates: {
    x: { type: Number, required: true, min: 0, max: 990 }, // 1000-10 (blok boyutu)
    y: { type: Number, required: true, min: 0, max: 990 }
  },
  size: {
    width: { type: Number, default: 10 }, // 10x10 varsayılan blok
    height: { type: Number, default: 10 }
  },
  owner: {
    name: String,
    email: { type: String, required: true, match: /.+\@.+\..+/ }
  },
  content: {
    url: { type: String, required: true },
    title: { type: String, maxlength: 100 },
    imagePath: String
  },
  payment: {
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    transactionId: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Koordinatlar için bileşik index (performans)
pixelSchema.index({ 'coordinates.x': 1, 'coordinates.y': 1 }, { unique: true });

module.exports = mongoose.model('Pixel', pixelSchema);