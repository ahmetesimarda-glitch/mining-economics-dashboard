import type { Prisma } from '@prisma/client';
import type { EquipmentCatalogWriteInput } from './types';
import {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
} from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Empty / invalid → null (unknown). Finite numbers pass through. */
function asOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  const n = asOptionalNumber(value);
  return n === null ? fallback : n;
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

export type NormalizedEquipmentCatalogWrite = {
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
  extraSpecs: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
};

/**
 * Normalize an untrusted API body into a Prisma-ready write payload.
 * Missing numeric specs become null (unknown) — never invent values.
 */
export function normalizeEquipmentCatalogInput(
  body: unknown,
  options: { requireModel?: boolean } = {}
): { data: NormalizedEquipmentCatalogWrite; error?: string } {
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
    : null;

  return {
    data: {
      code,
      manufacturer,
      model,
      category,
      description: asString(src.description).trim(),
      imageUrl: asString(src.imageUrl).trim(),
      capacityLabel: asString(src.capacityLabel).trim(),
      payloadTons: asOptionalNumber(src.payloadTons),
      bucketCapacityM3: asOptionalNumber(src.bucketCapacityM3),
      enginePowerKw: asOptionalNumber(src.enginePowerKw),
      operatingWeightTons: asOptionalNumber(src.operatingWeightTons),
      purchasePriceUsd: asOptionalNumber(src.purchasePriceUsd),
      fuelConsumptionLph: asOptionalNumber(src.fuelConsumptionLph),
      fuelTankCapacityL: asOptionalNumber(src.fuelTankCapacityL),
      usefulLifeYears: asOptionalNumber(src.usefulLifeYears) ?? 10,
      availabilityPct: asOptionalNumber(src.availabilityPct) ?? 85,
      maintenanceCostUsdYear: asOptionalNumber(src.maintenanceCostUsdYear),
      isPriceEstimated:
        typeof src.isPriceEstimated === 'boolean' ? src.isPriceEstimated : false,
      powerType,
      oemWebsite: asString(src.oemWebsite).trim(),
      country: asString(src.country).trim(),
      notes: asString(src.notes).trim(),
      searchAliases: asString(src.searchAliases).trim(),
      extraSpecs,
      isActive: typeof src.isActive === 'boolean' ? src.isActive : true,
      sortOrder: Math.trunc(asFiniteNumber(src.sortOrder, 0)),
    },
  };
}

function emptyWriteDefaults(): NormalizedEquipmentCatalogWrite {
  return {
    code: '',
    manufacturer: '',
    model: '',
    category: 'general',
    description: '',
    imageUrl: '',
    capacityLabel: '',
    payloadTons: null,
    bucketCapacityM3: null,
    enginePowerKw: null,
    operatingWeightTons: null,
    purchasePriceUsd: null,
    fuelConsumptionLph: null,
    fuelTankCapacityL: null,
    usefulLifeYears: 10,
    availabilityPct: 85,
    maintenanceCostUsdYear: null,
    isPriceEstimated: false,
    powerType: 'diesel',
    oemWebsite: '',
    country: '',
    notes: '',
    searchAliases: '',
    extraSpecs: null,
    isActive: true,
    sortOrder: 0,
  };
}

/** Prisma JSON write helper shared by catalog create/update routes. */
export function toOptionalJsonInput(
  value: Record<string, unknown> | null
): Prisma.InputJsonValue | undefined {
  if (value === null) return undefined;
  return value as Prisma.InputJsonValue;
}

/** Shared Prisma create/update scalar mapping from normalized write data. */
export function toEquipmentCatalogPrismaData(
  data: NormalizedEquipmentCatalogWrite
): Omit<NormalizedEquipmentCatalogWrite, 'extraSpecs'> & {
  extraSpecs: Prisma.InputJsonValue | undefined;
} {
  return {
    ...data,
    extraSpecs: toOptionalJsonInput(data.extraSpecs),
  };
}
