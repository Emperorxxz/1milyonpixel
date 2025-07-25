require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const pixelRoutes = require('./routes/pixels');
const drawRoutes = require('./routes/draw');
const pixelBlockRoutes = require('./routes/pixelBlocks');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/pixels', pixelRoutes);
app.use('/api/draw', drawRoutes);
app.use('/api/blocks', pixelBlockRoutes);
app.use('/api/admin', require('./routes/admin'));

// Frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// MongoDB Connection (Tekil bağlantı) - Opsiyonel test için
if (!mongoose.connection.readyState) {
  if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => {
      console.error('MongoDB bağlantı hatası:', err);
      console.log('Mock data ile devam ediliyor...');
    });
  } else {
    console.log('MongoDB URI bulunamadı, mock data ile çalışıyor...');
  }
}

// Sadece doğrudan çalıştırıldığında sunucuyu başlat
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  });
}

module.exports = app;
