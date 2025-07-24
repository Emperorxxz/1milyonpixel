const mongoose = require('mongoose');

const pixelBlockSchema = new mongoose.Schema({
  // Blok pozisyonu (100x100 grid, her blok 10x10 pixel)
  blockX: { type: Number, required: true, min: 0, max: 99 },
  blockY: { type: Number, required: true, min: 0, max: 99 },
  
  // Sahip bilgileri
  owner: {
    name: { type: String, required: true, maxlength: 50 },
    email: { type: String, required: true, match: /.+\@.+\..+/ }
  },
  
  // İçerik bilgileri
  content: {
    title: { type: String, required: true, maxlength: 100 },
    url: { type: String, required: true, match: /^https?:\/\/.+/ },
    description: { type: String, maxlength: 200 },
    imagePath: { type: String }, // Yüklenen resim yolu
    backgroundColor: { type: String, default: '#ffffff', match: /^#[0-9A-Fa-f]{6}$/ }
  },
  
  // Satın alma bilgileri
  purchase: {
    price: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'TRY', enum: ['USD', 'EUR', 'TRY'] },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'approved', 'rejected'], 
      default: 'pending' 
    },
    paymentId: String,
    purchaseDate: { type: Date, default: Date.now }
  },
  
  // İstatistikler
  stats: {
    clicks: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  
  // Durum
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active'],
    default: 'pending'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Blok koordinatları için unique index
pixelBlockSchema.index({ blockX: 1, blockY: 1 }, { unique: true });

// Email index
pixelBlockSchema.index({ 'owner.email': 1 });

// Status index
pixelBlockSchema.index({ status: 1 });

// Update timestamp middleware
pixelBlockSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PixelBlock', pixelBlockSchema);
