import { EQUIPMENT_REFERENCE } from '@/lib/market-reference';
import { slugifyEquipmentCode } from './validation';

export interface EquipmentCatalogSeedRow {
  code: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  capacityLabel: string;
  payloadTons: number;
  bucketCapacityM3: number;
  enginePowerKw: number;
  operatingWeightTons: number;
  purchasePriceUsd: number;
  fuelConsumptionLph: number;
  usefulLifeYears: number;
  availabilityPct: number;
  maintenanceCostUsdYear: number;
  powerType: string;
  isActive: boolean;
  sortOrder: number;
}

const KNOWN_MANUFACTURERS = [
  'CAT',
  'Komatsu',
  'Volvo',
  'Hitachi',
  'Epiroc',
  'Sandvik',
  'Metso',
] as const;

function splitManufacturerModel(rawModel: string): { manufacturer: string; model: string } {
  const trimmed = rawModel.trim();
  for (const mfr of KNOWN_MANUFACTURERS) {
    if (trimmed === mfr || trimmed.startsWith(`${mfr} `)) {
      return {
        manufacturer: mfr,
        model: trimmed.slice(mfr.length).trim() || trimmed,
      };
    }
  }
  // "Sabit çeneli kırıcı (primer)" etc. — no OEM prefix
  return { manufacturer: '', model: trimmed };
}

function parsePayloadTons(capacity: string): number {
  const match = capacity.match(/(\d+(?:[.,]\d+)?)\s*t\b/i);
  if (!match?.[1]) return 0;
  return Number(match[1].replace(',', '.')) || 0;
}

function parseBucketM3(capacity: string): number {
  const match = capacity.match(/(\d+(?:[.,]\d+)?)\s*m³/i) || capacity.match(/(\d+(?:[.,]\d+)?)\s*m3/i);
  if (!match?.[1]) return 0;
  return Number(match[1].replace(',', '.')) || 0;
}

/**
 * Build idempotent seed rows from the static EQUIPMENT_REFERENCE library.
 * Maintenance ≈ 4% of list price / year; useful life / availability are industry defaults.
 */
export function buildEquipmentCatalogSeedRows(): EquipmentCatalogSeedRow[] {
  return EQUIPMENT_REFERENCE.map((ref, index) => {
    const { manufacturer, model } = splitManufacturerModel(ref.model);
    const payloadTons = parsePayloadTons(ref.capacity);
    const bucketCapacityM3 = parseBucketM3(ref.capacity);
    const powerType = ref.note?.toLowerCase().includes('elektrik') ? 'electric' : 'diesel';
    const purchasePriceUsd = ref.priceUsd;
    const code = slugifyEquipmentCode([ref.category, manufacturer || 'generic', model]);

    return {
      code,
      manufacturer,
      model,
      category: ref.category,
      description: ref.note ?? '',
      capacityLabel: ref.capacity,
      payloadTons,
      bucketCapacityM3,
      enginePowerKw: 0,
      operatingWeightTons: 0,
      purchasePriceUsd,
      fuelConsumptionLph: ref.fuelLph,
      usefulLifeYears: 10,
      availabilityPct: 85,
      maintenanceCostUsdYear: Math.round(purchasePriceUsd * 0.04),
      powerType,
      isActive: true,
      sortOrder: index,
    };
  });
}
