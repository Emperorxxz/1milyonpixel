const express = require('express');
const PixelBlock = require('../models/PixelBlock');
const router = express.Router();

// Admin istatistikleri
router.get('/stats', async (req, res) => {
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
          },
          rejectedBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
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
      pendingBlocks: 0,
      rejectedBlocks: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm blokları getir (admin için - tüm durumlar)
router.get('/blocks', async (req, res) => {
  try {
    const blocks = await PixelBlock.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blok onaylama
router.post('/blocks/:id/approve', async (req, res) => {
  try {
    const block = await PixelBlock.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'active',
        'purchase.paymentStatus': 'approved'
      },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    res.json({ 
      message: 'Blok başarıyla onaylandı',
      block: block
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blok reddetme
router.post('/blocks/:id/reject', async (req, res) => {
  try {
    const block = await PixelBlock.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        'purchase.paymentStatus': 'rejected'
      },
      { new: true }
    );

    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    res.json({ 
      message: 'Blok reddedildi',
      block: block
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blok silme
router.delete('/blocks/:id', async (req, res) => {
  try {
    const block = await PixelBlock.findByIdAndDelete(req.params.id);

    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    // Eğer resim varsa dosyayı da sil
    if (block.content.imagePath) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../public', block.content.imagePath);
      
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ 
      message: 'Blok başarıyla silindi',
      blockId: req.params.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Son aktiviteler
router.get('/recent-activity', async (req, res) => {
  try {
    const recentBlocks = await PixelBlock.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('content.title owner.name status createdAt')
      .lean();

    const activities = recentBlocks.map(block => ({
      type: 'Yeni Blok',
      description: `${block.owner.name} tarafından "${block.content.title}" bloğu oluşturuldu`,
      createdAt: block.createdAt,
      status: block.status
    }));

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı istatistikleri
router.get('/users/stats', async (req, res) => {
  try {
    const userStats = await PixelBlock.aggregate([
      {
        $group: {
          _id: '$owner.email',
          name: { $first: '$owner.name' },
          email: { $first: '$owner.email' },
          totalBlocks: { $sum: 1 },
          totalSpent: { $sum: '$purchase.price' },
          activeBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 50
      }
    ]);

    res.json(userStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gelir analizi
router.get('/revenue/analysis', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchCondition = {};
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const revenueData = await PixelBlock.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyRevenue: { $sum: '$purchase.price' },
          dailyBlocks: { $sum: 1 },
          activeBlocks: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json(revenueData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blok durumu toplu güncelleme
router.post('/blocks/bulk-update', async (req, res) => {
  try {
    const { blockIds, status, action } = req.body;

    if (!blockIds || !Array.isArray(blockIds) || blockIds.length === 0) {
      return res.status(400).json({ error: 'Geçerli blok ID\'leri gerekli' });
    }

    let updateData = {};
    
    switch (action) {
      case 'approve':
        updateData = { 
          status: 'active',
          'purchase.paymentStatus': 'approved'
        };
        break;
      case 'reject':
        updateData = { 
          status: 'rejected',
          'purchase.paymentStatus': 'rejected'
        };
        break;
      case 'delete':
        const deletedBlocks = await PixelBlock.deleteMany({
          _id: { $in: blockIds }
        });
        return res.json({
          message: `${deletedBlocks.deletedCount} blok silindi`,
          deletedCount: deletedBlocks.deletedCount
        });
      default:
        return res.status(400).json({ error: 'Geçersiz işlem' });
    }

    const result = await PixelBlock.updateMany(
      { _id: { $in: blockIds } },
      updateData
    );

    res.json({
      message: `${result.modifiedCount} blok güncellendi`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
