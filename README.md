# ⛏️ Maden Fizibilite Analiz Paneli

Madencilik projelerinin ekonomik fizibilite analizini yapan kapsamlı web uygulaması.

## ✨ Özellikler

- **Proje Yönetimi**: Proje oluşturma, düzenleme, kopyalama ve karşılaştırma
- **Finansal Analiz**: NPV, IRR, geri ödeme süresi, başa baş fiyatı
- **Nakit Akışı**: Yıllık nakit akış tablosu ve grafikler
- **Duyarlılık Analizi**: Örümcek diyagramı, tornado, ısı haritası, esneklik
- **Monte Carlo Simülasyonu**: Olasılıksal risk analizi
- **Çevresel Analiz**: Karbon ayak izi, su tüketimi, rehabilitasyon
- **Canlı Piyasa Verileri**: Altın, gümüş, bakır, platin, paladyum + döviz kurları
- **Makina Referans Kütüphanesi**: Gerçekçi CAT/Komatsu/Sandvik/Epiroc fiyatları
- **Emisyon Faktörleri**: IPCC/DEFRA standart değerleri
- **Raporlama**: Yerel Puppeteer PDF, ExcelJS mühendislik çalışma kitabı, CSV dışa aktarma
- **Çok Dilli**: Türkçe / İngilizce
- **Koyu Mod**: Otomatik tema desteği

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler
- Node.js 18+ (20 LTS önerilir)
- PostgreSQL 14+

### Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenleyin (DATABASE_URL zorunlu)

# 3. Veritabanını oluştur
npx prisma db push

# 4. (İsteğe bağlı) Örnek veri yükle
npx ts-node scripts/seed.ts

# 5. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda açın: http://localhost:3000

### Docker ile Çalıştırma

```bash
docker-compose up -d
# Veritabanı tablolarını oluştur
docker-compose exec app npx prisma db push
# (İsteğe bağlı) Örnek veri
docker-compose exec app npx ts-node scripts/seed.ts
```

## 📚 Prodüksiyon Deploy

### VPS / Sunucu
```bash
npm run build
npm install -g pm2
pm2 start npm --name mining-app -- run start
pm2 save && pm2 startup
```

### Railway.app
1. Bu repoyu GitHub'a push'layın
2. [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub"
3. PostgreSQL eklentisi ekleyin
4. Ortam değişkeni olarak `DATABASE_URL` otomatik ayarlanır
5. Build komutu: `npm run build`, Start: `npm run start`

### Render.com
1. [render.com](https://render.com) → "New Web Service" → GitHub repo seçin
2. PostgreSQL veritabanı oluşturun
3. Ortam değişkenlerini ayarlayın
4. Build: `npm install && npx prisma generate && npm run build`
5. Start: `npm run start`

### Vercel
1. [vercel.com](https://vercel.com) → "Import Project" → GitHub repo
2. Framework: Next.js (otomatik algılanır)
3. Ortam değişkenleri: `DATABASE_URL` ekleyin
4. Vercel PostgreSQL veya Supabase kullanabilirsiniz

## 🛠️ Teknoloji Yapısı

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Veritabanı**: PostgreSQL
- **Diğer**: Leaflet (harita), ExcelJS (Excel), Puppeteer (PDF), Sonner (bildirimler)

## 📁 Proje Yapısı

```
├── app/
│   ├── api/              # Backend API rotaları
│   │   ├── market/       # Canlı piyasa verileri
│   │   └── projects/     # Proje CRUD, analiz, rapor
│   ├── compare/          # Proje karşılaştırma
│   ├── market/           # Piyasa verileri sayfası
│   └── projects/         # Proje detay/düzenleme
├── components/           # UI bileşenleri
├── lib/
│   ├── calculations.ts   # Finansal hesaplama motoru
│   ├── market-reference.ts # Makina & emisyon referansları
│   └── i18n/             # Çeviri dosyaları (TR/EN)
├── prisma/
│   └── schema.prisma     # Veritabanı şeması
└── scripts/
    └── seed.ts           # Örnek veri yükleyici
```

## 📄 Lisans

MAD436 Proje Ödevi — Ahmet Esim Arda
