const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const PixelBlock = require('../models/PixelBlock');
const Setting = require('../models/Setting');

// Yardımcı Fonksiyon: JWT Oluşturma
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token 1 gün geçerli
  });
};

// Yetkilendirme Middleware'i
const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token'ı header'dan al ('Bearer' kelimesini ayır)
      token = req.headers.authorization.split(' ')[1];
      
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Admin bilgisini isteğe ekle (parola olmadan)
      req.admin = await Admin.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ error: 'Yetkisiz erişim, token geçersiz' });
    }
  }
  
  if (!token) {
    res.status(401).json({ error: 'Yetkisiz erişim, token bulunamadı' });
  }
};


// --- YETKİLENDİRME ROTLARI ---

// POST /api/admin/register - Yeni admin kullanıcısı oluştur (Sadece ilk kurulum için)
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Sadece ilk adminin oluşturulmasına izin ver
    const adminExists = await Admin.countDocuments();
    if (adminExists > 0) {
        return res.status(400).json({ error: 'Admin kullanıcısı zaten mevcut.' });
    }

    try {
        const admin = await Admin.create({ username, password });
        res.status(201).json({
            _id: admin._id,
            username: admin.username,
            token: generateToken(admin._id),
        });
    } catch (error) {
        res.status(400).json({ error: 'Kullanıcı oluşturulamadı.' });
    }
});

// POST /api/admin/login - Admin girişi
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                username: admin.username,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ error: 'Geçersiz kullanıcı adı veya parola' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});


// --- KORUMALI ADMİN ROTLARI ---

// GET /api/admin/blocks/pending - Onay bekleyen blokları getir
router.get('/blocks/pending', protect, async (req, res) => {
    try {
        const pendingBlocks = await PixelBlock.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(pendingBlocks);
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /api/admin/blocks/:id/approve - Bir bloğu onayla
router.put('/blocks/:id/approve', protect, async (req, res) => {
    try {
        const block = await PixelBlock.findById(req.params.id);
        if (block) {
            block.status = 'active';
            const updatedBlock = await block.save();
            res.json(updatedBlock);
        } else {
            res.status(404).json({ error: 'Blok bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /api/admin/blocks/:id/reject - Bir bloğu reddet
router.put('/blocks/:id/reject', protect, async (req, res) => {
    try {
        const block = await PixelBlock.findById(req.params.id);
        if (block) {
            block.status = 'rejected';
            const updatedBlock = await block.save();
            res.json(updatedBlock);
        } else {
            res.status(404).json({ error: 'Blok bulunamadı' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/admin/blocks/all - Tüm blokları getir (admin için)
router.get('/blocks/all', protect, async (req, res) => {
    try {
        const allBlocks = await PixelBlock.find({}).sort({ createdAt: -1 });
        res.json(allBlocks);
    } catch (error) {
        res.status(500).json({ error: 'Tüm bloklar alınırken bir hata oluştu.' });
    }
});

// GET /api/admin/stats - Genel istatistikleri getir
router.get('/stats', protect, async (req, res) => {
    try {
        const totalBlocks = await PixelBlock.countDocuments();
        const activeBlocks = await PixelBlock.countDocuments({ status: 'active' });
        const pendingBlocks = await PixelBlock.countDocuments({ status: 'pending' });
        const totalClicks = await PixelBlock.aggregate([
            { $group: { _id: null, total: { $sum: '$stats.clicks' } } }
        ]);

        res.json({
            totalBlocks,
            activeBlocks,
            pendingBlocks,
            totalClicks: totalClicks.length > 0 ? totalClicks[0].total : 0,
        });
    } catch (error) {
        res.status(500).json({ error: 'İstatistikler alınırken hata oluştu.' });
    }
});


// --- AYARLAR ROTLARI ---

// GET /api/admin/settings - Ayarları getir
router.get('/settings', protect, async (req, res) => {
    try {
        const settings = await Setting.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Ayarlar alınırken bir hata oluştu.' });
    }
});

// PUT /api/admin/settings - Ayarları güncelle
router.put('/settings', protect, async (req, res) => {
    const { blockPrice, autoApprove, maxFileSize } = req.body;
    try {
        const settings = await Setting.findOneAndUpdate(
            { singleton: 'main_settings' },
            { $set: { blockPrice, autoApprove, maxFileSize } },
            { new: true, upsert: true } // 'upsert' creates the document if it doesn't exist
        );
        res.json(settings);
    } catch (error) {
        res.status(400).json({ error: 'Ayarlar güncellenirken bir hata oluştu.' });
    }
});


// --- KULLANICI ROTLARI ---

// GET /api/admin/users - Kullanıcıları (blok sahiplerini) listele
router.get('/users', protect, async (req, res) => {
    try {
        const users = await PixelBlock.aggregate([
            {
                $group: {
                    _id: '$owner.email', // Kullanıcıları email adresine göre grupla
                    name: { $first: '$owner.name' }, // İlk bulduğun ismi al
                    blockCount: { $sum: 1 }, // Sahip olduğu blok sayısını topla
                    totalSpent: { $sum: '$purchase.price' } // Harcadığı toplam tutar
                }
            },
            {
                $project: {
                    _id: 0, // _id alanını kaldır
                    email: '$_id', // _id'yi email olarak yeniden adlandır
                    name: 1,
                    blockCount: 1,
                    totalSpent: 1
                }
            },
            {
                $sort: { name: 1 } // İsim'e göre sırala
            }
        ]);
        res.json(users);
    } catch (error) {
        console.error('Kullanıcılar alınırken hata:', error);
        res.status(500).json({ error: 'Kullanıcılar alınırken bir hata oluştu.' });
    }
});


module.exports = router;
