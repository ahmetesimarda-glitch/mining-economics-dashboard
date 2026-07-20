import type { Prisma } from '@prisma/client';
import type { EquipmentCatalogWriteInput } from './types';
import {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
} from './types';

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

export type NormalizedEquipmentCatalogWrite = Required<
  Omit<EquipmentCatalogWriteInput, 'code' | 'extraSpecs'>
> & {
  code: string;
  extraSpecs: Record<string, unknown> | null;
};

/**
 * Normalize an untrusted API body into a Prisma-ready write payload.
 * Missing fields fall back to defaults; invalid category/powerType are replaced.
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

function emptyWriteDefaults(): NormalizedEquipmentCatalogWrite {
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

/** Prisma JSON write helper shared by catalog create/update routes. */
export function toOptionalJsonInput(
  value: Record<string, unknown> | null
): Prisma.InputJsonValue | undefined {
  if (value === null) return undefined;
  return value as Prisma.InputJsonValue;
}
