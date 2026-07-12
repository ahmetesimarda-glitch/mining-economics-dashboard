// =====================================================================
// Referans veri kütüphanesi: gerçekçi makina liste fiyatları,
// emisyon faktörleri ve emtia referans fiyatları.
// Kaynaklar: üretici liste fiyatları (yaklaşık, 2025-2026), IPCC/DEFRA
// emisyon faktörleri, TÜİK/TEİAŞ şebeke faktörü, piyasa raporları.
// Not: Makina fiyatları konfigürasyona göre ±15-20% değişebilir.
// =====================================================================

export interface EquipmentRef {
  category: string;      // kategori anahtarı
  model: string;
  capacity: string;      // kapasite / sınıf
  priceUsd: number;      // yaklaşık liste fiyatı (USD)
  fuelLph: number;       // ortalama yakıt tüketimi (lt/saat)
  note?: string;
}

export const EQUIPMENT_REFERENCE: EquipmentRef[] = [
  // --- Kaya Kamyonları (Rijit) ---
  { category: 'truck', model: 'CAT 770G', capacity: '40 t', priceUsd: 1_100_000, fuelLph: 35 },
  { category: 'truck', model: 'CAT 775G', capacity: '64 t', priceUsd: 1_450_000, fuelLph: 45 },
  { category: 'truck', model: 'Komatsu HD785-8', capacity: '91 t', priceUsd: 1_650_000, fuelLph: 55 },
  { category: 'truck', model: 'CAT 777G', capacity: '100 t', priceUsd: 1_950_000, fuelLph: 60 },
  { category: 'truck', model: 'CAT 785D', capacity: '150 t', priceUsd: 3_500_000, fuelLph: 90 },
  { category: 'truck', model: 'Komatsu 930E-5', capacity: '290 t', priceUsd: 6_000_000, fuelLph: 175 },
  { category: 'truck', model: 'CAT 793F', capacity: '250 t', priceUsd: 5_500_000, fuelLph: 160 },

  // --- Ekskavatörler ---
  { category: 'excavator', model: 'CAT 349', capacity: '50 t sınıfı', priceUsd: 600_000, fuelLph: 28 },
  { category: 'excavator', model: 'Volvo EC950F', capacity: '95 t sınıfı', priceUsd: 1_100_000, fuelLph: 45 },
  { category: 'excavator', model: 'CAT 6015B', capacity: '140 t, 8 m³', priceUsd: 2_800_000, fuelLph: 85 },
  { category: 'excavator', model: 'Komatsu PC2000-11', capacity: '200 t, 12 m³', priceUsd: 3_200_000, fuelLph: 120 },
  { category: 'excavator', model: 'Hitachi EX2600-7', capacity: '260 t, 15 m³', priceUsd: 4_500_000, fuelLph: 160 },

  // --- Yükleyiciler ---
  { category: 'loader', model: 'CAT 966 XE', capacity: '4.2 m³', priceUsd: 450_000, fuelLph: 18 },
  { category: 'loader', model: 'CAT 988K', capacity: '6.9 m³', priceUsd: 1_300_000, fuelLph: 40 },
  { category: 'loader', model: 'CAT 993K', capacity: '13 m³', priceUsd: 2_600_000, fuelLph: 75 },
  { category: 'loader', model: 'CAT 994K', capacity: '19 m³', priceUsd: 5_000_000, fuelLph: 130 },

  // --- Dozerler ---
  { category: 'dozer', model: 'CAT D8T', capacity: '39 t', priceUsd: 900_000, fuelLph: 35 },
  { category: 'dozer', model: 'CAT D9T', capacity: '49 t', priceUsd: 1_300_000, fuelLph: 45 },
  { category: 'dozer', model: 'Komatsu D375A-8', capacity: '72 t', priceUsd: 1_500_000, fuelLph: 55 },
  { category: 'dozer', model: 'CAT D11', capacity: '104 t', priceUsd: 2_500_000, fuelLph: 85 },

  // --- Greyder ---
  { category: 'grader', model: 'CAT 140', capacity: '3.7 m bıçak', priceUsd: 400_000, fuelLph: 15 },
  { category: 'grader', model: 'CAT 16M3', capacity: '4.9 m bıçak', priceUsd: 1_100_000, fuelLph: 30 },

  // --- Delici Makinalar ---
  { category: 'drill', model: 'Epiroc PowerROC T50', capacity: 'Ø89-140 mm', priceUsd: 650_000, fuelLph: 25 },
  { category: 'drill', model: 'Epiroc FlexiROC T45', capacity: 'Ø76-127 mm', priceUsd: 750_000, fuelLph: 25 },
  { category: 'drill', model: 'Sandvik DR410i', capacity: 'Ø152-251 mm (rotary)', priceUsd: 2_500_000, fuelLph: 70 },
  { category: 'drill', model: 'Epiroc Pit Viper 271', capacity: 'Ø171-270 mm (rotary)', priceUsd: 3_500_000, fuelLph: 90 },

  // --- Yeraltı Ekipmanları ---
  { category: 'underground', model: 'Sandvik DD422i (Jumbo)', capacity: '2 kollu delici', priceUsd: 1_200_000, fuelLph: 12 },
  { category: 'underground', model: 'Sandvik LH517i (LHD)', capacity: '17 t kova', priceUsd: 1_400_000, fuelLph: 35 },
  { category: 'underground', model: 'Sandvik TH545i', capacity: '45 t kamyon', priceUsd: 1_500_000, fuelLph: 40 },

  // --- Kırma-Eleme ---
  { category: 'crusher', model: 'Metso Lokotrack LT120', capacity: 'çeneli, mobil, 450 t/s', priceUsd: 900_000, fuelLph: 45 },
  { category: 'crusher', model: 'Sabit çeneli kırıcı (primer)', capacity: '600-800 t/s', priceUsd: 800_000, fuelLph: 0, note: 'Elektrikli' },
];

export interface EmissionFactor {
  key: string;
  factor: number;
  unit: string;
  source: string;
}

export const EMISSION_FACTORS: EmissionFactor[] = [
  { key: 'diesel', factor: 2.68, unit: 'kg CO₂/litre', source: 'IPCC / DEFRA' },
  { key: 'gasoline', factor: 2.31, unit: 'kg CO₂/litre', source: 'IPCC / DEFRA' },
  { key: 'electricityTr', factor: 0.442, unit: 'kg CO₂e/kWh', source: 'TEİAŞ / IEA (Türkiye şebekesi)' },
  { key: 'naturalGas', factor: 2.02, unit: 'kg CO₂/m³', source: 'IPCC' },
  { key: 'anfo', factor: 170, unit: 'kg CO₂/ton patlayıcı', source: 'Yaşam döngüsü analizleri' },
  { key: 'haulage', factor: 0.10, unit: 'kg CO₂/ton-km', source: 'DEFRA (ağır vasıta)' },
];

export interface CommodityRef {
  key: string;
  priceUsd: number;
  unit: string;
  note: string;
}

// Canlı API kapsamında olmayan emtialar için referans fiyatlar (piyasa raporları, 2025-2026 civarı)
export const COMMODITY_REFERENCE: CommodityRef[] = [
  { key: 'thermalCoal', priceUsd: 140, unit: 'USD/ton', note: 'Newcastle 6000 kcal/kg' },
  { key: 'cokingCoal', priceUsd: 250, unit: 'USD/ton', note: 'Premium HCC, Avustralya FOB' },
  { key: 'lignite', priceUsd: 35, unit: 'USD/ton', note: 'Yurtiçi, düşük kalori (~2500 kcal/kg)' },
  { key: 'ironOre', priceUsd: 105, unit: 'USD/ton', note: '%62 Fe, CFR Çin' },
  { key: 'aluminum', priceUsd: 2600, unit: 'USD/ton', note: 'LME 3 aylık' },
  { key: 'zinc', priceUsd: 2800, unit: 'USD/ton', note: 'LME 3 aylık' },
  { key: 'nickel', priceUsd: 16500, unit: 'USD/ton', note: 'LME 3 aylık' },
  { key: 'lead', priceUsd: 2050, unit: 'USD/ton', note: 'LME 3 aylık' },
  { key: 'chromite', priceUsd: 300, unit: 'USD/ton', note: '%42-44 Cr₂O₃ konsantre' },
  { key: 'boron', priceUsd: 700, unit: 'USD/ton', note: 'Rafine boraks eşdeğeri' },
];
