# Kendi Altyapına Taşıma Rehberi (Self-Hosting Guide)

Bu proje, standart bir web uygulamasıdır. Aşağıdaki adımları izleyerek kendi sunucunuzda çalıştırabilirsiniz.

---

## 1. Gereksinimler

| Bileşen | Minimum | Önerilen |
|---------|---------|----------|
| Node.js | 18.x | 20.x LTS |
| Veritabanı (PostgreSQL) | 14+ | 16+ |
| RAM | 512 MB | 1 GB+ |
| Disk | 500 MB | 2 GB |

## 2. Kurulum Adımları

### 2.1 Kaynak Kodunu İndir

Bu konuşmadaki **Files** butonundan `mining_economics_dashboard_source.tar.gz` dosyasını indirin ve açın:

```bash
tar xzf mining_economics_dashboard_source.tar.gz
cd nextjs_space
```

### 2.2 Bağımlılıkları Yükle

```bash
npm install
# veya
yarn install
```

### 2.3 Ortam Değişkenlerini Ayarla

`.env` dosyası oluşturun:

```env
# PostgreSQL bağlantı dizesi
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/mining_db"

# Uygulama URL'si (production için)
NEXTAUTH_URL="https://sizin-domain.com"

# (İsteğe bağlı) AI analizi için OpenAI uyumlu API anahtarı
# Bu olmadan uygulama çalışır, sadece AI Rapor sekmesi devre dışı kalır.
# ABACUSAI_API_KEY="sk-..."

# (İsteğe bağlı) PDF raporu üretimi için HTML2PDF servisi
# Bu olmadan uygulama çalışır, sadece PDF indirme devre dışı kalır.
# HTML2PDF_API_URL="..."
```

### 2.4 Veritabanını Kur

```bash
# PostgreSQL'de boş bir veritabanı oluşturun:
createdb mining_db

# Prisma ile tabloları oluşturun:
npx prisma db push

# (İsteğe bağlı) Örnek proje verisi ekleyin:
npx ts-node scripts/seed.ts
```

### 2.5 Çalıştır

**Geliştirme:**
```bash
npm run dev
# http://localhost:3000
```

**Prodüksiyon:**
```bash
npm run build
npm run start
```

---

## 3. Prodüksiyon Dağıtım Seçenekleri

### Seçenek A: VPS / Sunucu (En ucuz, öğrenci için ideal)

Herhangi bir Linux VPS'te (Hetzner, DigitalOcean, Contabo vb.) çalıştırabilirsiniz:

```bash
# PM2 ile arka planda çalıştır
npm install -g pm2
npm run build
pm2 start npm --name mining -- run start
pm2 save
pm2 startup
```

Nginx reverse proxy ile 80/443 portuna yönlendirin. Let's Encrypt ile ücretsiz SSL alabilirsiniz.

**Tahmini maliyet:** ~3-5 €/ay (Hetzner/Contabo VPS)

### Seçenek B: Railway / Render (Kolay, ücretsiz başlangıç)

- [Railway.app](https://railway.app): GitHub reposunu bağlayın, PostgreSQL eklentisi ekleyin, otomatik deploy.
- [Render.com](https://render.com): Benzer şekilde, ücretsiz PostgreSQL dahil.

**Maliyet:** Ücretsiz katman mevcut (sınırlı), sonra ~5-7 $/ay.

### Seçenek C: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mining
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mining
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

```bash
docker-compose up -d
```

---

## 4. Abacus AI'a Özel Bileşenler (Değiştirilmesi Gerekenler)

Bu bileşenler Abacus AI platformuna bağlıdır; kendi altyapınızda alternatif çözüm gerektirir:

| Özellik | Mevcut Durum | Alternatif |
|---------|-------------|------------|
| **PDF Raporu** | Yerel Puppeteer (`puppeteer-core` + Chrome/Chromium) | Railway/Docker'da Chromium kurun; `PUPPETEER_EXECUTABLE_PATH` ayarlayın |
| **AI Analizi** | Abacus LLM API (OpenAI uyumlu) | OpenAI API, Anthropic API, veya yerel Ollama |
| **Veritabanı** | Abacus barındırmalı PostgreSQL | Kendi PostgreSQL sunucunuz |

### 4.1 PDF Raporu

PDF üretimi artık Abacus HTML2PDF'e bağlı değildir. `app/api/projects/[id]/pdf/route.ts` HTML raporu oluşturur ve `lib/reports/pdf/render-local-pdf.ts` içinde Puppeteer ile yerelde PDF'e çevirir.

Railway / Docker için:

```bash
# Debian/Ubuntu tabanlı image
apt-get install -y chromium
# veya
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

Gerekli launch bayrakları (`--no-sandbox`, `--disable-dev-shm-usage`) kodda zaten ayarlıdır.

### 4.2 AI Analizi İçin Değişiklik

`app/api/projects/[id]/ai-analysis/route.ts` dosyasındaki API endpoint'i OpenAI uyumlu herhangi bir servis ile çalışır. Sadece `.env`'deki `ABACUSAI_API_KEY`'i kendi API anahtarınızla değiştirin ve endpoint URL'sini güncelleyin.

---

## 5. Mevcut Verileri Taşıma

Abacus'taki veritabanından verileri dışa aktarmak için:

```bash
# Abacus veritabanından dump al (bağlantı dizesi .env'den)
pg_dump "$DATABASE_URL" > backup.sql

# Kendi veritabanınıza yükle
psql "postgresql://user:pass@localhost:5432/mining_db" < backup.sql
```

---

## 6. Proje Yapısı Özeti

```
nextjs_space/
├── app/                    # Sayfalar ve API rotaları
│   ├── api/                # Backend API endpoint'leri
│   │   ├── market/         # Canlı piyasa verileri
│   │   └── projects/       # Proje CRUD, analiz, rapor
│   ├── compare/            # Proje karşılaştırma sayfası
│   ├── market/             # Piyasa verileri sayfası
│   └── projects/           # Proje detay/düzenle sayfaları
├── components/             # Paylaşılan UI bileşenleri
├── lib/                    # Hesaplama motoru, yardımcı fonksiyonlar
│   ├── calculations.ts     # Ana finansal hesaplama motoru (~1000 satır)
│   ├── market-reference.ts # Makina fiyatları ve emisyon referansları
│   └── i18n/               # Türkçe/İngilizce çeviri dosyaları
├── prisma/
│   └── schema.prisma       # Veritabanı şeması
└── scripts/
    └── seed.ts             # Örnek veri yükleyici
```

---

## 7. Sorular?

Bu rehber uygulamanın taşınması için temel adımları kapsar. Teknik sorunlarla karşılaşırsanız uygulama standart Node.js/Next.js/Prisma/PostgreSQL yığını kullandığından, bu teknolojilerin resmi dokümantasyonlarına başvurabilirsiniz.
