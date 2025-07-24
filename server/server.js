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

// MongoDB Connection (Tekil bağlantı)
if (!mongoose.connection.readyState) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));
}

// Sadece doğrudan çalıştırıldığında sunucuyu başlat
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  });
}

module.exports = app;
