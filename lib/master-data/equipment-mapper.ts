import type {
  EquipmentCatalogWriteInput,
  ProjectEquipmentSnapshot,
} from './equipment-types';
import {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
} from './equipment-types';

type CatalogLike = {
  manufacturer: string;
  model: string;
  category: string;
  capacityLabel: string;
  payloadTons: number;
  bucketCapacityM3: number;
  purchasePriceUsd: number;
  fuelConsumptionLph: number;
  maintenanceCostUsdYear: number;
  powerType: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

export function slugifyEquipmentCode(parts: string[]): string {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function isValidEquipmentCategory(value: string): boolean {
  return (EQUIPMENT_CATALOG_CATEGORIES as readonly string[]).includes(value);
}

export function isValidPowerType(value: string): boolean {
  return (EQUIPMENT_POWER_TYPES as readonly string[]).includes(value);
}

/**
 * Normalize an untrusted API body into a Prisma-ready write payload.
 * Missing fields fall back to defaults; invalid category/powerType are replaced.
 */
export function normalizeEquipmentCatalogInput(
  body: unknown,
  options: { requireModel?: boolean } = {}
): { data: Required<Omit<EquipmentCatalogWriteInput, 'code' | 'extraSpecs'>> & {
  code: string;
  extraSpecs: Record<string, unknown> | null;
}; error?: string } {
  const src = isPlainObject(body) ? body : {};
  const model = asString(src.model).trim();
  if (options.requireModel !== false && !model) {
    return {
      data: emptyWriteDefaults(),
      error: 'Model zorunludur',
    };
  }

  const manufacturer = asString(src.manufacturer).trim();
  const categoryRaw = asString(src.category, 'general').trim() || 'general';
  const category = isValidEquipmentCategory(categoryRaw) ? categoryRaw : 'general';
  const powerRaw = asString(src.powerType, 'diesel').trim() || 'diesel';
  const powerType = isValidPowerType(powerRaw) ? powerRaw : 'diesel';

  const codeRaw = asString(src.code).trim();
  const code =
    codeRaw ||
    slugifyEquipmentCode([category, manufacturer || 'oem', model || 'item']);

  const extraSpecs = isPlainObject(src.extraSpecs)
    ? (src.extraSpecs as Record<string, unknown>)
    : src.extraSpecs === null
      ? null
      : null;

  return {
    data: {
      code,
      manufacturer,
      model,
      category,
      description: asString(src.description).trim(),
      capacityLabel: asString(src.capacityLabel).trim(),
      payloadTons: asFiniteNumber(src.payloadTons, 0),
      bucketCapacityM3: asFiniteNumber(src.bucketCapacityM3, 0),
      enginePowerKw: asFiniteNumber(src.enginePowerKw, 0),
      operatingWeightTons: asFiniteNumber(src.operatingWeightTons, 0),
      purchasePriceUsd: asFiniteNumber(src.purchasePriceUsd, 0),
      fuelConsumptionLph: asFiniteNumber(src.fuelConsumptionLph, 0),
      usefulLifeYears: asFiniteNumber(src.usefulLifeYears, 10),
      availabilityPct: asFiniteNumber(src.availabilityPct, 85),
      maintenanceCostUsdYear: asFiniteNumber(src.maintenanceCostUsdYear, 0),
      powerType,
      extraSpecs,
      isActive: typeof src.isActive === 'boolean' ? src.isActive : true,
      sortOrder: Math.trunc(asFiniteNumber(src.sortOrder, 0)),
    },
  };
}

function emptyWriteDefaults(): Required<Omit<EquipmentCatalogWriteInput, 'code' | 'extraSpecs'>> & {
  code: string;
  extraSpecs: Record<string, unknown> | null;
} {
  return {
    code: '',
    manufacturer: '',
    model: '',
    category: 'general',
    description: '',
    capacityLabel: '',
    payloadTons: 0,
    bucketCapacityM3: 0,
    enginePowerKw: 0,
    operatingWeightTons: 0,
    purchasePriceUsd: 0,
    fuelConsumptionLph: 0,
    usefulLifeYears: 10,
    availabilityPct: 85,
    maintenanceCostUsdYear: 0,
    powerType: 'diesel',
    extraSpecs: null,
    isActive: true,
    sortOrder: 0,
  };
}

/**
 * Copy catalog values into a project Equipment row.
 * Intentionally does NOT set a foreign key — historical isolation.
 */
export function snapshotCatalogToProjectEquipment(
  catalog: CatalogLike,
  overrides: Partial<ProjectEquipmentSnapshot> = {}
): ProjectEquipmentSnapshot {
  const unitCost = catalog.purchasePriceUsd;
  const quantity = overrides.quantity ?? 1;
  const spareQuantity = overrides.spareQuantity ?? 0;
  const bucket = catalog.bucketCapacityM3;
  const payload = catalog.payloadTons;

  const base: ProjectEquipmentSnapshot = {
    machineType: [catalog.manufacturer, catalog.model].filter(Boolean).join(' ').trim() || catalog.model,
    model: catalog.model,
    tonnageCapacity: catalog.capacityLabel || (payload > 0 ? `${payload} t` : ''),
    quantity,
    spareQuantity,
    fuelConsumption: catalog.fuelConsumptionLph,
    maintenanceCost: catalog.maintenanceCostUsdYear,
    unitCost,
    totalCost: (quantity + spareQuantity) * unitCost,
    isCustom: false,
    equipmentCategory: catalog.category || 'general',
    dailyWorkHours: 8,
    maintenancePeriodHours: 500,
    operatorCount: 1,
    powerType: catalog.powerType || 'diesel',
    hourlyFuelConsumption: catalog.fuelConsumptionLph,
    productionImpact: 0,
    drillCapacity: 0,
    holeDiameter: 0,
    maxDrillDepth: 0,
    bucketVolume: bucket,
    transportCapacity: payload,
    loadingCapacity: bucket,
    crushingCapacity: 0,
    gallerySuitability: '',
  };

  return { ...base, ...overrides, totalCost: ((overrides.quantity ?? base.quantity) + (overrides.spareQuantity ?? base.spareQuantity)) * (overrides.unitCost ?? base.unitCost) };
}
