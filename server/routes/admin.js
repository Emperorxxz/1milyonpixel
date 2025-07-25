const express = require('express');
// const PixelBlock = require('../models/PixelBlock');
const router = express.Router();

// Mock data for testing
const mockStats = {
  totalBlocks: 15,
  totalClicks: 1250,
  totalViews: 3400,
  totalRevenue: 4500,
  activeBlocks: 12,
  pendingBlocks: 3,
  rejectedBlocks: 0
};

const mockBlocks = [
  {
    _id: '507f1f77bcf86cd799439011',
    blockX: 10,
    blockY: 15,
    owner: { name: 'Ahmet Yılmaz', email: 'ahmet@example.com' },
    content: {
      title: 'Mükemmel Web Tasarım',
      url: 'https://example.com',
      description: 'En iyi web tasarım hizmetleri'
    },
    purchase: { price: 300, currency: 'TRY' },
    status: 'pending',
    createdAt: new Date('2024-01-15')
  },
  {
    _id: '507f1f77bcf86cd799439012',
    blockX: 25,
    blockY: 30,
    owner: { name: 'Fatma Kaya', email: 'fatma@example.com' },
    content: {
      title: 'E-Ticaret Çözümleri',
      url: 'https://eticaret.com',
      description: 'Profesyonel e-ticaret siteleri'
    },
    purchase: { price: 500, currency: 'TRY' },
    status: 'active',
    createdAt: new Date('2024-01-10')
  },
  {
    _id: '507f1f77bcf86cd799439013',
    blockX: 50,
    blockY: 60,
    owner: { name: 'Mehmet Demir', email: 'mehmet@example.com' },
    content: {
      title: 'Mobil Uygulama Geliştirme',
      url: 'https://mobil.com',
      description: 'iOS ve Android uygulamaları'
    },
    purchase: { price: 750, currency: 'TRY' },
    status: 'active',
    createdAt: new Date('2024-01-08')
  }
];

const mockActivity = [
  {
    type: 'Yeni Blok',
    description: 'Ahmet Yılmaz tarafından "Mükemmel Web Tasarım" bloğu oluşturuldu',
    createdAt: new Date('2024-01-15'),
    status: 'pending'
  },
  {
    type: 'Blok Onayı',
    description: 'Fatma Kaya\'nın "E-Ticaret Çözümleri" bloğu onaylandı',
    createdAt: new Date('2024-01-12'),
    status: 'active'
  }
];

// Admin istatistikleri
router.get('/stats', async (req, res) => {
  try {
    res.json(mockStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm blokları getir (admin için - tüm durumlar)
router.get('/blocks', async (req, res) => {
  try {
    res.json(mockBlocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blok onaylama
router.post('/blocks/:id/approve', async (req, res) => {
  try {
    const blockId = req.params.id;
    const block = mockBlocks.find(b => b._id === blockId);
    
    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    // Mock update
    block.status = 'active';
    if (block.purchase) {
      block.purchase.paymentStatus = 'approved';
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
    const blockId = req.params.id;
    const block = mockBlocks.find(b => b._id === blockId);
    
    if (!block) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    // Mock update
    block.status = 'rejected';
    if (block.purchase) {
      block.purchase.paymentStatus = 'rejected';
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
    const blockId = req.params.id;
    const initialLength = mockBlocks.length;
    const filteredBlocks = mockBlocks.filter(block => block._id !== blockId);

    if (filteredBlocks.length === initialLength) {
      return res.status(404).json({ error: 'Blok bulunamadı' });
    }

    // Mock data için blok listesini güncelle
    mockBlocks.length = 0; // Array'i temizle
    mockBlocks.push(...filteredBlocks); // Yeni elemanları ekle

    res.json({ 
      message: 'Blok başarıyla silindi',
      blockId: blockId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Son aktiviteler
router.get('/recent-activity', async (req, res) => {
  try {
    res.json(mockActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kullanıcı istatistikleri
router.get('/users/stats', async (req, res) => {
  try {
    // Bu kısım mock data için geçerli değil, aslında bir kullanıcı modeline bağlı değil.
    // Ancak, orijinal kodda kullanıcı modeline bağlı bir kısım var.
    // Bu kısım mock data için kaldırılmalı veya mock data için bir kullanıcı modeline bağlı kısım eklenebilir.
    // Şimdilik, mock data için kullanıcı modeline bağlı kısım kaldırıldı.
    res.json([
      { _id: 'ahmet@example.com', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', totalBlocks: 3, totalSpent: 1500, activeBlocks: 2, pendingBlocks: 1, lastPurchase: new Date('2024-01-15') },
      { _id: 'fatma@example.com', name: 'Fatma Kaya', email: 'fatma@example.com', totalBlocks: 2, totalSpent: 500, activeBlocks: 1, pendingBlocks: 1, lastPurchase: new Date('2024-01-10') },
      { _id: 'mehmet@example.com', name: 'Mehmet Demir', email: 'mehmet@example.com', totalBlocks: 1, totalSpent: 750, activeBlocks: 1, pendingBlocks: 0, lastPurchase: new Date('2024-01-08') }
    ]);
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

    // Bu kısım mock data için geçerli değil, aslında bir gelir modeline bağlı değil.
    // Ancak, orijinal kodda gelir modeline bağlı bir kısım var.
    // Bu kısım mock data için kaldırılmalı veya mock data için bir gelir modeline bağlı kısım eklenebilir.
    // Şimdilik, mock data için gelir modeline bağlı kısım kaldırıldı.
    res.json([
      { _id: { year: 2024, month: 1, day: 15 }, dailyRevenue: 300, dailyBlocks: 1, activeBlocks: 1 },
      { _id: { year: 2024, month: 1, day: 10 }, dailyRevenue: 500, dailyBlocks: 1, activeBlocks: 1 },
      { _id: { year: 2024, month: 1, day: 8 }, dailyRevenue: 750, dailyBlocks: 1, activeBlocks: 1 }
    ]);
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

    let updatedCount = 0;
    let deletedCount = 0;

    for (const blockId of blockIds) {
      const block = mockBlocks.find(b => b._id === blockId);
      if (!block) {
        continue; // Skip if block not found
      }

      switch (action) {
        case 'approve':
          block.status = 'active';
          if (block.purchase) {
            block.purchase.paymentStatus = 'approved';
          }
          updatedCount++;
          break;
        case 'reject':
          block.status = 'rejected';
          if (block.purchase) {
            block.purchase.paymentStatus = 'rejected';
          }
          updatedCount++;
          break;
                 case 'delete':
           const initialLength = mockBlocks.length;
           const filteredBlocks = mockBlocks.filter(b => b._id !== blockId);
           if (filteredBlocks.length === initialLength) {
             continue; // Block not found for deletion
           }
           // Mock data için array'i güncelle
           mockBlocks.length = 0;
           mockBlocks.push(...filteredBlocks);
           deletedCount++;
           break;
        default:
          // No action taken for invalid action
          break;
      }
    }

    res.json({
      message: `${updatedCount} blok güncellendi, ${deletedCount} blok silindi`,
      modifiedCount: updatedCount,
      deletedCount: deletedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
