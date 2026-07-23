export type FormatLocale = 'tr' | 'en';
let formatLocale: FormatLocale = 'en';
export function setFormatLocale(locale: FormatLocale) { formatLocale = locale; }
export function getFormatLocale(): FormatLocale { return formatLocale; }

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
  const locale = formatLocale === 'en' ? 'en-US' : 'tr-TR';
  return (value ?? 0).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatYear(value: number | null | undefined): string {
  const v = value ?? 0;
  const unit = formatLocale === 'en' ? 'yr' : 'yıl';
  if (v === Math.floor(v)) return `${v} ${unit}`;
  return `${v.toFixed(1)} ${unit}`;
}

/** Fallback labels when Commodity Master Data is unavailable. Prefer catalog API. */
export const MINE_TYPES = [
  { value: 'copper', label: 'Copper' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'nickel', label: 'Nickel' },
  { value: 'lithium', label: 'Lithium' },
  { value: 'iron', label: 'Iron' },
  { value: 'coal', label: 'Coal' },
  { value: 'zinc', label: 'Zinc' },
  { value: 'lead', label: 'Lead' },
  { value: 'bauxite', label: 'Bauxite' },
  { value: 'rareEarth', label: 'Rare Earth' },
  { value: 'phosphate', label: 'Phosphate' },
  { value: 'uranium', label: 'Uranium' },
  { value: 'potash', label: 'Potash' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'tin', label: 'Tin' },
  { value: 'molybdenum', label: 'Molybdenum' },
  { value: 'chromium', label: 'Chromium' },
  { value: 'manganese', label: 'Manganese' },
  { value: 'lignite', label: 'Lignite' },
  { value: 'boron', label: 'Boron' },
  { value: 'marble', label: 'Marble' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'other', label: 'Other' },
];

export const MINING_METHODS = [
  { value: 'openPit', label: 'Open Pit' },
  { value: 'underground', label: 'Underground' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'TRY', label: 'TRY (₺)', symbol: '₺' },
];

export const POWER_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
];

export const EQUIPMENT_CATEGORIES = [
  { value: 'drill', label: 'Drill' },
  { value: 'truck', label: 'Truck' },
  { value: 'excavator', label: 'Excavator' },
  { value: 'loader', label: 'Loader' },
  { value: 'crusher', label: 'Crusher' },
  { value: 'dozer', label: 'Dozer' },
  { value: 'grader', label: 'Grader' },
  { value: 'underground', label: 'Underground Equipment' },
  { value: 'support', label: 'Support Equipment' },
  { value: 'general', label: 'General' },
];

export function getCategoryLabel(value: string | null | undefined): string {
  return EQUIPMENT_CATEGORIES.find((c: { value: string; label: string }) => c?.value === value)?.label ?? (value ?? 'General');
}

export function getMineTypeLabel(value: string | null | undefined): string {
  return MINE_TYPES.find((t: { value: string; label: string }) => t?.value === value)?.label ?? (value ?? 'Unknown');
}

export function getMiningMethodLabel(value: string | null | undefined): string {
  return MINING_METHODS.find((m: { value: string; label: string }) => m?.value === value)?.label ?? (value ?? 'Unknown');
}

// Category-specific extra fields configuration
export function getCategoryFields(category: string): { key: string; label: string; suffix: string }[] {
  switch (category) {
    case 'drill':
      return [
        { key: 'drillCapacity', label: 'Drilling Capacity', suffix: 'm/h' },
        { key: 'holeDiameter', label: 'Hole Diameter', suffix: 'mm' },
        { key: 'maxDrillDepth', label: 'Max. Drill Depth', suffix: 'm' },
        { key: 'productionImpact', label: 'Hourly Advance', suffix: 'm/h' },
      ];
    case 'truck':
      return [
        { key: 'transportCapacity', label: 'Haul Capacity', suffix: 'ton' },
        { key: 'productionImpact', label: 'Production Impact', suffix: 'ton/h' },
      ];
    case 'excavator':
      return [
        { key: 'bucketVolume', label: 'Bucket Volume', suffix: 'm³' },
        { key: 'productionImpact', label: 'Digging Capacity', suffix: 'ton/h' },
      ];
    case 'loader':
      return [
        { key: 'loadingCapacity', label: 'Loading Capacity', suffix: 'ton/h' },
        { key: 'bucketVolume', label: 'Bucket Volume', suffix: 'm³' },
        { key: 'productionImpact', label: 'Production Impact', suffix: 'ton/h' },
      ];
    case 'crusher':
      return [
        { key: 'crushingCapacity', label: 'Crushing Capacity', suffix: 'ton/h' },
        { key: 'productionImpact', label: 'Processing Capacity', suffix: 'ton/h' },
      ];
    case 'underground':
      return [
        { key: 'gallerySuitability', label: 'Drift Suitability', suffix: '' },
        { key: 'productionImpact', label: 'Production Impact', suffix: 'ton/h' },
      ];
    default:
      return [
        { key: 'productionImpact', label: 'Production Impact', suffix: 'ton/h' },
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
  { machineType: 'Excavator', equipmentCategory: 'excavator', ...baseEquipFields },
  { machineType: 'Haul Truck', equipmentCategory: 'truck', ...baseEquipFields },
  { machineType: 'Dozer', equipmentCategory: 'dozer', ...baseEquipFields },
  { machineType: 'Grader', equipmentCategory: 'grader', ...baseEquipFields },
  { machineType: 'Drill', equipmentCategory: 'drill', ...baseEquipFields },
  { machineType: 'Loader', equipmentCategory: 'loader', ...baseEquipFields },
  { machineType: 'Water Truck', equipmentCategory: 'support', ...baseEquipFields },
];

export const DEFAULT_EQUIPMENT_UNDERGROUND = [
  { machineType: 'Jumbo Drill', equipmentCategory: 'drill', ...baseEquipFields },
  { machineType: 'LHD (Load-Haul-Dump)', equipmentCategory: 'underground', ...baseEquipFields },
  { machineType: 'Underground Truck', equipmentCategory: 'truck', ...baseEquipFields },
  { machineType: 'Ventilation Fan', equipmentCategory: 'support', ...baseEquipFields, powerType: 'electric' },
  { machineType: 'Shotcrete Machine', equipmentCategory: 'underground', ...baseEquipFields },
  { machineType: 'Ore Pass System', equipmentCategory: 'underground', ...baseEquipFields, powerType: 'electric' },
];

export const DEFAULT_PERSONNEL = [
  { role: 'Mining Engineer', count: 2, monthlySalary: 0 },
  { role: 'Geology Engineer', count: 1, monthlySalary: 0 },
  { role: 'Shift Supervisor', count: 3, monthlySalary: 0 },
  { role: 'Operator', count: 10, monthlySalary: 0 },
  { role: 'Technician', count: 4, monthlySalary: 0 },
  { role: 'Driver', count: 6, monthlySalary: 0 },
  { role: 'Laborer', count: 15, monthlySalary: 0 },
  { role: 'Security', count: 4, monthlySalary: 0 },
  { role: 'Administrative Staff', count: 3, monthlySalary: 0 },
];

export const OPEN_PIT_COSTS = [
  { name: 'Waste Dumping', category: 'openPit', unit: 'MUSD' },
  { name: 'Overburden Removal', category: 'openPit', unit: 'MUSD' },
  { name: 'Slope Angle Adjustment', category: 'openPit', unit: 'MUSD' },
  { name: 'Road Construction', category: 'openPit', unit: 'MUSD' },
  { name: 'Blasting Costs', category: 'openPit', unit: 'MUSD' },
  { name: 'Bench Preparation', category: 'openPit', unit: 'MUSD' },
];

export const UNDERGROUND_COSTS = [
  { name: 'Ground Support', category: 'underground', unit: 'MUSD' },
  { name: 'Shotcrete', category: 'underground', unit: 'MUSD' },
  { name: 'Ventilation', category: 'underground', unit: 'MUSD' },
  { name: 'Drainage', category: 'underground', unit: 'MUSD' },
  { name: 'Drift Development', category: 'underground', unit: 'MUSD' },
  { name: 'Shaft Sinking', category: 'underground', unit: 'MUSD' },
  { name: 'Underground Lighting', category: 'underground', unit: 'MUSD' },
];
