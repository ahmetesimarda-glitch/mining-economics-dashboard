import { slugifyEquipmentCode } from '../validation';
import { getOemProfile } from './oem';

export const PRICE_NOTE =
  'Purchase price is an approximate list-price estimate for feasibility studies (±15–25% typical variation by config/region).';

export interface EquipmentCatalogSeedRow {
  code: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  imageUrl: string;
  capacityLabel: string;
  payloadTons: number | null;
  bucketCapacityM3: number | null;
  enginePowerKw: number | null;
  operatingWeightTons: number | null;
  purchasePriceUsd: number | null;
  fuelConsumptionLph: number | null;
  fuelTankCapacityL: number | null;
  usefulLifeYears: number | null;
  availabilityPct: number | null;
  maintenanceCostUsdYear: number | null;
  isPriceEstimated: boolean;
  powerType: string;
  oemWebsite: string;
  country: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: number;
}

/** Compact seed input — OEM website/country/aliases filled from registry. */
export interface CompactEquipmentSpec {
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  capacityLabel: string;
  payloadTons?: number | null;
  bucketCapacityM3?: number | null;
  enginePowerKw?: number | null;
  operatingWeightTons?: number | null;
  purchasePriceUsd: number;
  fuelConsumptionLph?: number | null;
  fuelTankCapacityL?: number | null;
  usefulLifeYears?: number;
  availabilityPct?: number;
  /** If omitted, defaults to ~4% of purchase price. */
  maintenanceCostUsdYear?: number | null;
  powerType?: string;
  notes?: string;
  searchAliasesExtra?: string;
}

export function buildSeedRow(
  spec: CompactEquipmentSpec,
  sortOrder: number
): EquipmentCatalogSeedRow {
  const oem = getOemProfile(spec.manufacturer);
  const price = spec.purchasePriceUsd;
  const maintenance =
    spec.maintenanceCostUsdYear === undefined
      ? Math.round(price * 0.04)
      : spec.maintenanceCostUsdYear;
  const aliases = spec.searchAliasesExtra
    ? `${oem.searchAliases},${spec.searchAliasesExtra}`
    : oem.searchAliases;
  const notes = spec.notes ? `${PRICE_NOTE} ${spec.notes}` : PRICE_NOTE;

  return {
    code: slugifyEquipmentCode([spec.category, spec.manufacturer, spec.model]),
    manufacturer: oem.manufacturer,
    model: spec.model,
    category: spec.category,
    description: spec.description,
    imageUrl: '',
    capacityLabel: spec.capacityLabel,
    payloadTons: spec.payloadTons ?? null,
    bucketCapacityM3: spec.bucketCapacityM3 ?? null,
    enginePowerKw: spec.enginePowerKw ?? null,
    operatingWeightTons: spec.operatingWeightTons ?? null,
    purchasePriceUsd: price,
    fuelConsumptionLph: spec.fuelConsumptionLph ?? null,
    fuelTankCapacityL: spec.fuelTankCapacityL ?? null,
    usefulLifeYears: spec.usefulLifeYears ?? 10,
    availabilityPct: spec.availabilityPct ?? 85,
    maintenanceCostUsdYear: maintenance,
    isPriceEstimated: true,
    powerType: spec.powerType ?? 'diesel',
    oemWebsite: oem.oemWebsite,
    country: oem.country,
    notes,
    searchAliases: aliases,
    isActive: true,
    sortOrder,
  };
}

export function buildSeedRows(specs: CompactEquipmentSpec[]): EquipmentCatalogSeedRow[] {
  return specs.map((spec, index) => buildSeedRow(spec, index + 1));
}
