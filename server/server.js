require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const pixelRoutes = require('./routes/pixels');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/pixels', pixelRoutes);

// Frontend route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB bağlantısı başarılı'))
.catch(err => console.error('MongoDB bağlantı hatası:', err));

// Server start
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} kullanımda, 5 saniye sonra tekrar denenecek...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 5000);
  }
});

module.exports = app;