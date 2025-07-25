const express = require('express');
const PixelBlock = require('../models/PixelBlock');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Yetkilendirme Middleware'i (admin rotaları için)
const protect = require('../middleware/protect'); // protect middleware'ini import et

// Multer konfigürasyonu - resim yükleme
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'block-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir (jpg, png, gif, ico)'));
    }
  }
});

// Grid için tüm görünür blokları (aktif ve onay bekleyen) getir
router.get('/all-for-grid', async (req, res) => {
    try {
        const blocks = await PixelBlock.find({ status: { $in: ['active', 'pending'] } })
            .select('blockX blockY status content.backgroundColor content.imagePath')
            .lean();
        res.json(blocks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tüm aktif blokları getir (Admin korumalı)
router.get('/', protect, async (req, res) => {
  try {
    const blocks = await PixelBlock.find({ status: 'active' })
      .select('-owner.email -owner.phone -purchase.paymentId')
      .lean();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Belirli bir bloğun detaylarını getir (Admin korumalı)
router.get('/:blockX/:blockY', protect, async (req, res) => {
  try {
    const { blockX, blockY } = req.params;
    const block = await PixelBlock.findOne({ 
      blockX: parseInt(blockX), 
      blockY: parseInt(blockY),
      status: 'active'
    }).select('-owner.email -owner.phone -purchase.paymentId');
    
    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }
    
    // View sayısını artır
    await PixelBlock.updateOne(
      { _id: block._id },
      { $inc: { 'stats.views': 1 } }
    );
    
    res.json(block);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni blok başvurusu oluşturma
router.post('/purchase', upload.single('image'), async (req, res) => {
  try {
    const {
      blockX, blockY, ownerName, ownerEmail,
      title, url, description, backgroundColor, price
    } = req.body;

    // Blok zaten satılmış mı veya onay bekliyor mu kontrol et
    const existingBlock = await PixelBlock.findOne({
      blockX: parseInt(blockX),
      blockY: parseInt(blockY)
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'Bu blok zaten dolu veya rezerve edilmiş.' });
    }

    // Yeni blok başvurusu oluştur
    const newBlock = new PixelBlock({
      blockX: parseInt(blockX),
      blockY: parseInt(blockY),
      owner: {
        name: ownerName,
        email: ownerEmail
      },
      content: {
        title,
        url,
        description,
        backgroundColor: backgroundColor || '#ffffff',
        imagePath: req.file ? `/uploads/${req.file.filename}` : null
      },
      purchase: {
        price: parseFloat(price) || 300,
        currency: 'TRY',
        paymentStatus: 'awaiting_payment'
      },
      status: 'pending' // Admin onayı için bekliyor
    });

    await newBlock.save();
    
    // TODO: Admin'e bildirim e-postası gönderilebilir.

    res.status(201).json({
      message: 'Başvurunuz başarıyla alındı. Admin onayı sonrası size e-posta ile bilgi verilecektir.',
      blockId: newBlock._id
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Blok tıklama (istatistik) (Admin korumalı)
router.post('/:blockX/:blockY/click', protect, async (req, res) => {
  try {
    const { blockX, blockY } = req.params;
    
    const block = await PixelBlock.findOneAndUpdate(
      { 
        blockX: parseInt(blockX), 
        blockY: parseInt(blockY),
        status: 'active'
      },
      { $inc: { 'stats.clicks': 1 } },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    res.json({ 
      message: 'Tıklama kaydedildi',
      url: block.content.url,
      clicks: block.stats.clicks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Müsait blokları kontrol et (Admin korumalı)
router.get('/available/check', protect, async (req, res) => {
  try {
    const occupiedBlocks = await PixelBlock.find({})
      .select('blockX blockY status')
      .lean();
    
    const occupiedPositions = occupiedBlocks.map(block => ({
      x: block.blockX,
      y: block.blockY,
      status: block.status
    }));

    res.json({
      total: 10000,
      occupied: occupiedBlocks.length,
      available: 10000 - occupiedBlocks.length,
      occupiedPositions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İstatistikler (Admin korumalı)
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const stats = await PixelBlock.aggregate([
      {
        $group: {
          _id: null,
          totalBlocks: { $sum: 1 },
          totalClicks: { $sum: '$stats.clicks' },
          totalViews: { $sum: '$stats.views' },
          totalRevenue: { $sum: '$purchase.price' },
          activeBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalBlocks: 0,
      totalClicks: 0,
      totalViews: 0,
      totalRevenue: 0,
      activeBlocks: 0,
      pendingBlocks: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

router.delete('/:blockX/:blockY', protect, async (req, res) => {
    try {
        const { blockX, blockY } = req.params;
        const result = await PixelBlock.deleteOne({ blockX, blockY });
        if (result.deletedCount === 1) {
            res.json({ message: 'Blok silindi' });
        } else {
            res.status(404).json({ error: 'Blok bulunamadı' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PixelBlock.findByIdAndDelete(id);
        if (deleted) {
            res.json({ message: 'Blok silindi' });
        } else {
            res.status(404).json({ error: 'Blok bulunamadı' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
