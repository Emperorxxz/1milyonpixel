require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const Pixel = require('./models/Pixel');

const app = express();
const upload = multer({ dest: 'public/uploads/' });

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoint'leri
app.get('/api/pixels', async (req, res) => {
  const pixels = await Pixel.find();
  res.json(pixels);
});

app.post('/api/pixels', upload.single('image'), async (req, res) => {
  const { x, y, width, height, url, title } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  const pixel = new Pixel({
    x: parseInt(x),
    y: parseInt(y),
    width: parseInt(width),
    height: parseInt(height),
    url,
    title,
    image: imagePath,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}` // Rastgele renk
  });

  await pixel.save();
  res.status(201).json(pixel);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`));
// Helmet ile güvenlik header'ları
const helmet = require('helmet');
app.use(helmet());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // Her IP için 100 istek
});
app.use(limiter);

// CORS ayarları (production'da güncellenecek)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://siteniz.com' : '*'
}));
const pixelRoutes = require('./routes/pixels');
app.use('/api/pixels', pixelRoutes);