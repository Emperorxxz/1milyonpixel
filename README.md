# 1 Milyon Pixel Projesi

Gerçek "1 Milyon Pixel" konsepti - Kullanıcılar pixel blokları satın alabilir, kendi logolarını ve web sitelerini tanıtabilirler.

## 🚀 Özellikler

### Ana Özellikler
- **1000x1000 piksellik grid** (1 milyon piksel)
- **100x100 blok sistemi** (10,000 satılabilir blok)
- **Pixel blok satın alma sistemi**
- **Resim yükleme** (logo/favicon)
- **URL yönlendirme** ve tıklama takibi
- **Tooltip** ve hover efektleri
- **Zoom** ve navigasyon
- **Responsive tasarım**

### Teknik Özellikler
- **Full-stack Node.js** uygulaması
- **MongoDB** veritabanı
- **Multer** ile dosya yükleme
- **RESTful API**
- **Modern ES6+ JavaScript**
- **CSS Grid** ve Flexbox
- **Jest** test framework'ü

## 📦 Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **MongoDB'yi başlatın:**
   ```bash
   # Windows için:
   mongod
   
   # macOS/Linux için:
   sudo systemctl start mongod
   ```

3. **Ortam değişkenlerini ayarlayın:**
   ```bash
   cp .env.example .env
   ```

4. **Sunucuyu başlatın:**
   ```bash
   npm start
   ```

5. **Tarayıcıda açın:**
   http://localhost:4000

## 🎯 Kullanım

### Blok Satın Alma
1. Grid üzerinde müsait (gri) bir bloka tıklayın
2. "Blok Satın Al" butonuna tıklayın
3. Formu doldurun:
   - Sahip bilgileri (ad, email, telefon)
   - İçerik bilgileri (başlık, URL, açıklama)
   - Logo/ikon yükleyin (opsiyonel)
   - Arkaplan rengi seçin
4. Satın alma talebini gönderin
5. Admin onayından sonra blok aktif hale gelir

### Blok Durumları
- **Gri**: Müsait blok
- **Sarı**: Onay bekleyen blok
- **Kırmızı**: Aktif blok (tıklanabilir)
- **Turuncu**: Seçili blok

## 🔧 API Endpoints

### Blok İşlemleri
- `GET /api/blocks` - Aktif blokları listele
- `GET /api/blocks/:x/:y` - Belirli blok detayı
- `POST /api/blocks/purchase` - Yeni blok satın al
- `POST /api/blocks/:x/:y/click` - Blok tıklama kaydı

### İstatistikler
- `GET /api/blocks/stats/summary` - Genel istatistikler
- `GET /api/blocks/available/check` - Müsait blok kontrolü

### Eski API (Çizim)
- `POST /api/draw` - Pixel çiz
- `GET /api/draw` - Tüm pikselleri getir
- `DELETE /api/draw` - Tuvali temizle

## 🗄️ Veritabanı Yapısı

### PixelBlock Modeli
```javascript
{
  blockX: Number,           // 0-99 arası X koordinatı
  blockY: Number,           // 0-99 arası Y koordinatı
  owner: {
    name: String,           // Sahip adı
    email: String,          // E-posta
    phone: String           // Telefon (opsiyonel)
  },
  content: {
    title: String,          // Blok başlığı
    url: String,            // Hedef URL
    description: String,    // Açıklama
    imagePath: String,      // Yüklenen resim yolu
    backgroundColor: String // Arkaplan rengi
  },
  purchase: {
    price: Number,          // Fiyat
    currency: String,       // Para birimi
    paymentStatus: String,  // Ödeme durumu
    paymentId: String       // Ödeme ID
  },
  stats: {
    clicks: Number,         // Tıklama sayısı
    views: Number           // Görüntülenme sayısı
  },
  status: String            // pending/approved/active/rejected
}
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# CI modunda çalıştır
npm run test:ci
```

## 📱 Responsive Tasarım

- **Desktop**: Tam özellikli deneyim
- **Tablet**: Optimize edilmiş grid boyutu
- **Mobile**: Touch-friendly arayüz, zoom desteği

## 🔒 Güvenlik

- **XSS koruması**: Input sanitization
- **Dosya yükleme güvenliği**: Tip ve boyut kontrolü
- **Rate limiting**: API isteklerinde sınırlama
- **Input validation**: Mongoose schema validation

## 🚧 Gelecek Özellikler

- [ ] Admin paneli
- [ ] PayPal/Stripe ödeme entegrasyonu
- [ ] E-posta bildirimleri
- [ ] Blok arama ve filtreleme
- [ ] Sosyal medya paylaşımı
- [ ] Analytics dashboard
- [ ] Bulk blok satın alma
- [ ] Blok transfer sistemi

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bakın.
