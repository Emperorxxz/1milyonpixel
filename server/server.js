require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pixelRoutes = require('./routes/pixels');
const drawRoutes = require('./routes/draw');
const pixelBlockRoutes = require('./routes/pixelBlocks');

const app = express();

// Security Middlewares
app.use(helmet());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api', limiter);


// Core Middlewares
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

// HTTP sunucusu ve Socket.IO kurulumu
const http = require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

// Socket.IO bağlantı mantığı
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı');

  socket.on('draw_pixel', (data) => {
    // Gelen piksel verisini diğer tüm istemcilere yayınla
    socket.broadcast.emit('update_pixel', data);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı');
  });
});


// Sadece doğrudan çalıştırıldığında sunucuyu başlat
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
  });
}

module.exports = { app, server };
