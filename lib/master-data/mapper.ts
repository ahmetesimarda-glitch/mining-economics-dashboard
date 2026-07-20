import type {
  CatalogSnapshotSource,
  EquipmentCatalogFormState,
  EquipmentCatalogItemDto,
  ProjectEquipmentSnapshot,
} from './types';

export const EMPTY_EQUIPMENT_CATALOG_FORM: EquipmentCatalogFormState = {
  code: '',
  manufacturer: '',
  model: '',
  category: 'truck',
  description: '',
  imageUrl: '',
  capacityLabel: '',
  payloadTons: '',
  bucketCapacityM3: '',
  enginePowerKw: '',
  operatingWeightTons: '',
  purchasePriceUsd: '',
  fuelConsumptionLph: '',
  fuelTankCapacityL: '',
  usefulLifeYears: '10',
  availabilityPct: '85',
  maintenanceCostUsdYear: '',
  isPriceEstimated: false,
  powerType: 'diesel',
  oemWebsite: '',
  country: '',
  notes: '',
  searchAliases: '',
  isActive: true,
  sortOrder: '0',
};

function nullableNumberToForm(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function equipmentCatalogItemToForm(
  item: EquipmentCatalogItemDto
): EquipmentCatalogFormState {
  return {
    code: item.code,
    manufacturer: item.manufacturer,
    model: item.model,
    category: item.category,
    description: item.description,
    imageUrl: item.imageUrl ?? '',
    capacityLabel: item.capacityLabel,
    payloadTons: nullableNumberToForm(item.payloadTons),
    bucketCapacityM3: nullableNumberToForm(item.bucketCapacityM3),
    enginePowerKw: nullableNumberToForm(item.enginePowerKw),
    operatingWeightTons: nullableNumberToForm(item.operatingWeightTons),
    purchasePriceUsd: nullableNumberToForm(item.purchasePriceUsd),
    fuelConsumptionLph: nullableNumberToForm(item.fuelConsumptionLph),
    fuelTankCapacityL: nullableNumberToForm(item.fuelTankCapacityL),
    usefulLifeYears: nullableNumberToForm(item.usefulLifeYears ?? 10),
    availabilityPct: nullableNumberToForm(item.availabilityPct ?? 85),
    maintenanceCostUsdYear: nullableNumberToForm(item.maintenanceCostUsdYear),
    isPriceEstimated: item.isPriceEstimated ?? false,
    powerType: item.powerType || 'diesel',
    oemWebsite: item.oemWebsite ?? '',
    country: item.country ?? '',
    notes: item.notes ?? '',
    searchAliases: item.searchAliases ?? '',
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

function formNumberOrNull(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function equipmentCatalogFormToPayload(
  form: EquipmentCatalogFormState
): Record<string, unknown> {
  return {
    code: form.code.trim() || undefined,
    manufacturer: form.manufacturer.trim(),
    model: form.model.trim(),
    category: form.category,
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    capacityLabel: form.capacityLabel.trim(),
    payloadTons: formNumberOrNull(form.payloadTons),
    bucketCapacityM3: formNumberOrNull(form.bucketCapacityM3),
    enginePowerKw: formNumberOrNull(form.enginePowerKw),
    operatingWeightTons: formNumberOrNull(form.operatingWeightTons),
    purchasePriceUsd: formNumberOrNull(form.purchasePriceUsd),
    fuelConsumptionLph: formNumberOrNull(form.fuelConsumptionLph),
    fuelTankCapacityL: formNumberOrNull(form.fuelTankCapacityL),
    usefulLifeYears: formNumberOrNull(form.usefulLifeYears) ?? 10,
    availabilityPct: formNumberOrNull(form.availabilityPct) ?? 85,
    maintenanceCostUsdYear: formNumberOrNull(form.maintenanceCostUsdYear),
    isPriceEstimated: form.isPriceEstimated,
    powerType: form.powerType,
    oemWebsite: form.oemWebsite.trim(),
    country: form.country.trim(),
    notes: form.notes.trim(),
    searchAliases: form.searchAliases.trim(),
    isActive: form.isActive,
    sortOrder: Math.trunc(formNumberOrNull(form.sortOrder) ?? 0),
  };
}

/**
 * Copy catalog values into a project Equipment row.
 * Intentionally does NOT set a foreign key — historical isolation.
 * Null catalog specs become 0 in the project row (engine expects numbers).
 */
export function snapshotCatalogToProjectEquipment(
  catalog: CatalogSnapshotSource,
  overrides: Partial<ProjectEquipmentSnapshot> = {}
): ProjectEquipmentSnapshot {
  const unitCost = catalog.purchasePriceUsd ?? 0;
  const quantity = overrides.quantity ?? 1;
  const spareQuantity = overrides.spareQuantity ?? 0;
  const bucket = catalog.bucketCapacityM3 ?? 0;
  const payload = catalog.payloadTons ?? 0;
  const fuelLph = catalog.fuelConsumptionLph ?? 0;
  const maint = catalog.maintenanceCostUsdYear ?? 0;

  // Map catalog category keys onto project equipmentCategory literals.
  const categoryMap: Record<string, string> = {
    undergroundTruck: 'truck',
    undergroundLoader: 'underground',
    jumbo: 'underground',
  };
  const equipmentCategory =
    categoryMap[catalog.category] ?? catalog.category ?? 'general';

  const base: ProjectEquipmentSnapshot = {
    machineType:
      [catalog.manufacturer, catalog.model].filter(Boolean).join(' ').trim() ||
      catalog.model,
    model: catalog.model,
    tonnageCapacity:
      catalog.capacityLabel || (payload > 0 ? `${payload} t` : ''),
    quantity,
    spareQuantity,
    fuelConsumption: fuelLph,
    maintenanceCost: maint,
    unitCost,
    totalCost: (quantity + spareQuantity) * unitCost,
    isCustom: false,
    equipmentCategory,
    dailyWorkHours: 8,
    maintenancePeriodHours: 500,
    operatorCount: 1,
    powerType: catalog.powerType || 'diesel',
    hourlyFuelConsumption: fuelLph,
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

  return {
    ...base,
    ...overrides,
    totalCost:
      ((overrides.quantity ?? base.quantity) +
        (overrides.spareQuantity ?? base.spareQuantity)) *
      (overrides.unitCost ?? base.unitCost),
  };
}

export function formatEquipmentUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** Display helper: null/undefined/0-unknown technical values show as em dash. */
export function formatSpecNumber(
  value: number | null | undefined,
  options?: { suffix?: string; digits?: number; treatZeroAsEmpty?: boolean }
): string {
  if (value === null || value === undefined) return '—';
  if (options?.treatZeroAsEmpty && value === 0) return '—';
  const digits = options?.digits ?? 0;
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
  return options?.suffix ? `${formatted} ${options.suffix}` : formatted;
}
