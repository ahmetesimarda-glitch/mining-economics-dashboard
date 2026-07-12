export function formatCurrency(value: number | null | undefined, decimals: number = 2): string {
  const v = value ?? 0;
  if (Math.abs(v) >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(decimals)} MUSD`;
  }
  if (Math.abs(v) >= 1_000) {
    return `${(v / 1_000).toFixed(decimals)}K USD`;
  }
  return `${v.toFixed(decimals)} USD`;
}

export function formatMUSD(value: number | null | undefined, decimals: number = 2): string {
  const v = value ?? 0;
  return `${v.toFixed(decimals)} MUSD`;
}

export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  return `%${(value ?? 0).toFixed(decimals)}`;
}

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  return (value ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatYear(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v === Math.floor(v)) return `${v} yıl`;
  return `${v.toFixed(1)} yıl`;
}

export const MINE_TYPES = [
  { value: 'lignite', label: 'Linyit' },
  { value: 'coal', label: 'Kömür' },
  { value: 'gold', label: 'Altın' },
  { value: 'copper', label: 'Bakır' },
  { value: 'iron', label: 'Demir' },
  { value: 'chrome', label: 'Krom' },
  { value: 'marble', label: 'Mermer' },
  { value: 'boron', label: 'Bor' },
  { value: 'silver', label: 'Gümüş' },
  { value: 'zinc', label: 'Çinko' },
  { value: 'other', label: 'Diğer' },
];

export const MINING_METHODS = [
  { value: 'openPit', label: 'Açık Ocak' },
  { value: 'underground', label: 'Yer Altı' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'TRY', label: 'TRY (₺)', symbol: '₺' },
];

export const POWER_TYPES = [
  { value: 'diesel', label: 'Dizel' },
  { value: 'electric', label: 'Elektrik' },
  { value: 'hybrid', label: 'Hibrit' },
];

export const EQUIPMENT_CATEGORIES = [
  { value: 'drill', label: 'Delici' },
  { value: 'truck', label: 'Kamyon' },
  { value: 'excavator', label: 'Ekskavatör' },
  { value: 'loader', label: 'Yükleyici' },
  { value: 'crusher', label: 'Konkasör' },
  { value: 'dozer', label: 'Dozer' },
  { value: 'grader', label: 'Greyder' },
  { value: 'underground', label: 'Yer Altı Ekipmanı' },
  { value: 'support', label: 'Destek Ekipmanı' },
  { value: 'general', label: 'Genel' },
];

export function getCategoryLabel(value: string | null | undefined): string {
  return EQUIPMENT_CATEGORIES.find((c: any) => c?.value === value)?.label ?? (value ?? 'Genel');
}

export function getMineTypeLabel(value: string | null | undefined): string {
  return MINE_TYPES.find((t: any) => t?.value === value)?.label ?? (value ?? 'Bilinmiyor');
}

export function getMiningMethodLabel(value: string | null | undefined): string {
  return MINING_METHODS.find((m: any) => m?.value === value)?.label ?? (value ?? 'Bilinmiyor');
}

// Category-specific extra fields configuration
export function getCategoryFields(category: string): { key: string; label: string; suffix: string }[] {
  switch (category) {
    case 'drill':
      return [
        { key: 'drillCapacity', label: 'Delme Kapasitesi', suffix: 'm/saat' },
        { key: 'holeDiameter', label: 'Delik Çapı', suffix: 'mm' },
        { key: 'maxDrillDepth', label: 'Maks. Delme Derinliği', suffix: 'm' },
        { key: 'productionImpact', label: 'Saatlik İlerleme', suffix: 'm/saat' },
      ];
    case 'truck':
      return [
        { key: 'transportCapacity', label: 'Taşıma Kapasitesi', suffix: 'ton' },
        { key: 'productionImpact', label: 'Üretim Etkisi', suffix: 'ton/saat' },
      ];
    case 'excavator':
      return [
        { key: 'bucketVolume', label: 'Kepçe Hacmi', suffix: 'm³' },
        { key: 'productionImpact', label: 'Kazı Kapasitesi', suffix: 'ton/saat' },
      ];
    case 'loader':
      return [
        { key: 'loadingCapacity', label: 'Yükleme Kapasitesi', suffix: 'ton/saat' },
        { key: 'bucketVolume', label: 'Kepçe Hacmi', suffix: 'm³' },
        { key: 'productionImpact', label: 'Üretim Etkisi', suffix: 'ton/saat' },
      ];
    case 'crusher':
      return [
        { key: 'crushingCapacity', label: 'Kırma Kapasitesi', suffix: 'ton/saat' },
        { key: 'productionImpact', label: 'İşleme Kapasitesi', suffix: 'ton/saat' },
      ];
    case 'underground':
      return [
        { key: 'gallerySuitability', label: 'Galeri Uygunluğu', suffix: '' },
        { key: 'productionImpact', label: 'Üretim Etkisi', suffix: 'ton/saat' },
      ];
    default:
      return [
        { key: 'productionImpact', label: 'Üretim Etkisi', suffix: 'ton/saat' },
      ];
  }
}

const baseEquipFields = {
  model: '', tonnageCapacity: '', quantity: 1, spareQuantity: 0,
  fuelConsumption: 0, maintenanceCost: 0, unitCost: 0, totalCost: 0,
  dailyWorkHours: 8, maintenancePeriodHours: 500, operatorCount: 1,
  powerType: 'diesel', hourlyFuelConsumption: 0, productionImpact: 0,
  drillCapacity: 0, holeDiameter: 0, maxDrillDepth: 0,
  bucketVolume: 0, transportCapacity: 0, loadingCapacity: 0,
  crushingCapacity: 0, gallerySuitability: '',
};

export const DEFAULT_EQUIPMENT_OPEN_PIT = [
  { machineType: 'Ekskavatör', equipmentCategory: 'excavator', ...baseEquipFields },
  { machineType: 'Kamyon', equipmentCategory: 'truck', ...baseEquipFields },
  { machineType: 'Dozer', equipmentCategory: 'dozer', ...baseEquipFields },
  { machineType: 'Greyder', equipmentCategory: 'grader', ...baseEquipFields },
  { machineType: 'Delici (Drill)', equipmentCategory: 'drill', ...baseEquipFields },
  { machineType: 'Yükleyici (Loader)', equipmentCategory: 'loader', ...baseEquipFields },
  { machineType: 'Su Tankeri', equipmentCategory: 'support', ...baseEquipFields },
];

export const DEFAULT_EQUIPMENT_UNDERGROUND = [
  { machineType: 'Jumbo Delici', equipmentCategory: 'drill', ...baseEquipFields },
  { machineType: 'LHD (Yükle-Taşı-Boşalt)', equipmentCategory: 'underground', ...baseEquipFields },
  { machineType: 'Yeraltı Kamyonu', equipmentCategory: 'truck', ...baseEquipFields },
  { machineType: 'Havalandırma Fanı', equipmentCategory: 'support', ...baseEquipFields, powerType: 'electric' },
  { machineType: 'Shotcrete Makinesi', equipmentCategory: 'underground', ...baseEquipFields },
  { machineType: 'Cevher Geçirme Sistemi', equipmentCategory: 'underground', ...baseEquipFields, powerType: 'electric' },
];

export const DEFAULT_PERSONNEL = [
  { role: 'Maden Mühendisi', count: 2, monthlySalary: 0 },
  { role: 'Jeoloji Mühendisi', count: 1, monthlySalary: 0 },
  { role: 'Vardiya Amiri', count: 3, monthlySalary: 0 },
  { role: 'Operatör', count: 10, monthlySalary: 0 },
  { role: 'Teknisyen', count: 4, monthlySalary: 0 },
  { role: 'Şoför', count: 6, monthlySalary: 0 },
  { role: 'İşçi', count: 15, monthlySalary: 0 },
  { role: 'Güvenlik', count: 4, monthlySalary: 0 },
  { role: 'İdari Personel', count: 3, monthlySalary: 0 },
];

export const OPEN_PIT_COSTS = [
  { name: 'Pasa Döküm', category: 'openPit', unit: 'MUSD' },
  { name: 'Dekapaj', category: 'openPit', unit: 'MUSD' },
  { name: 'Şev Açıları Düzenleme', category: 'openPit', unit: 'MUSD' },
  { name: 'Yol Yapımı', category: 'openPit', unit: 'MUSD' },
  { name: 'Patlatma Giderleri', category: 'openPit', unit: 'MUSD' },
  { name: 'Basamak Düzenleme', category: 'openPit', unit: 'MUSD' },
];

export const UNDERGROUND_COSTS = [
  { name: 'Tahkimat', category: 'underground', unit: 'MUSD' },
  { name: 'Püskürtme Beton', category: 'underground', unit: 'MUSD' },
  { name: 'Havalandırma', category: 'underground', unit: 'MUSD' },
  { name: 'Drenaj', category: 'underground', unit: 'MUSD' },
  { name: 'Galeri Açma', category: 'underground', unit: 'MUSD' },
  { name: 'Kuyu Açma', category: 'underground', unit: 'MUSD' },
  { name: 'Yeraltı Aydınlatma', category: 'underground', unit: 'MUSD' },
];
