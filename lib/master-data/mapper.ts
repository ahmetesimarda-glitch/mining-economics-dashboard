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
  capacityLabel: '',
  payloadTons: '',
  bucketCapacityM3: '',
  enginePowerKw: '',
  operatingWeightTons: '',
  purchasePriceUsd: '',
  fuelConsumptionLph: '',
  usefulLifeYears: '10',
  availabilityPct: '85',
  maintenanceCostUsdYear: '',
  powerType: 'diesel',
  isActive: true,
  sortOrder: '0',
};

export function equipmentCatalogItemToForm(
  item: EquipmentCatalogItemDto
): EquipmentCatalogFormState {
  return {
    code: item.code,
    manufacturer: item.manufacturer,
    model: item.model,
    category: item.category,
    description: item.description,
    capacityLabel: item.capacityLabel,
    payloadTons: String(item.payloadTons ?? ''),
    bucketCapacityM3: String(item.bucketCapacityM3 ?? ''),
    enginePowerKw: String(item.enginePowerKw ?? ''),
    operatingWeightTons: String(item.operatingWeightTons ?? ''),
    purchasePriceUsd: String(item.purchasePriceUsd ?? ''),
    fuelConsumptionLph: String(item.fuelConsumptionLph ?? ''),
    usefulLifeYears: String(item.usefulLifeYears ?? 10),
    availabilityPct: String(item.availabilityPct ?? 85),
    maintenanceCostUsdYear: String(item.maintenanceCostUsdYear ?? ''),
    powerType: item.powerType || 'diesel',
    isActive: item.isActive,
    sortOrder: String(item.sortOrder ?? 0),
  };
}

export function equipmentCatalogFormToPayload(
  form: EquipmentCatalogFormState
): Record<string, unknown> {
  const num = (raw: string, fallback = 0): number => {
    if (raw.trim() === '') return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    code: form.code.trim() || undefined,
    manufacturer: form.manufacturer.trim(),
    model: form.model.trim(),
    category: form.category,
    description: form.description.trim(),
    capacityLabel: form.capacityLabel.trim(),
    payloadTons: num(form.payloadTons),
    bucketCapacityM3: num(form.bucketCapacityM3),
    enginePowerKw: num(form.enginePowerKw),
    operatingWeightTons: num(form.operatingWeightTons),
    purchasePriceUsd: num(form.purchasePriceUsd),
    fuelConsumptionLph: num(form.fuelConsumptionLph),
    usefulLifeYears: num(form.usefulLifeYears, 10),
    availabilityPct: num(form.availabilityPct, 85),
    maintenanceCostUsdYear: num(form.maintenanceCostUsdYear),
    powerType: form.powerType,
    isActive: form.isActive,
    sortOrder: Math.trunc(num(form.sortOrder)),
  };
}

/**
 * Copy catalog values into a project Equipment row.
 * Intentionally does NOT set a foreign key — historical isolation.
 */
export function snapshotCatalogToProjectEquipment(
  catalog: CatalogSnapshotSource,
  overrides: Partial<ProjectEquipmentSnapshot> = {}
): ProjectEquipmentSnapshot {
  const unitCost = catalog.purchasePriceUsd;
  const quantity = overrides.quantity ?? 1;
  const spareQuantity = overrides.spareQuantity ?? 0;
  const bucket = catalog.bucketCapacityM3;
  const payload = catalog.payloadTons;

  const base: ProjectEquipmentSnapshot = {
    machineType:
      [catalog.manufacturer, catalog.model].filter(Boolean).join(' ').trim() ||
      catalog.model,
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

  return {
    ...base,
    ...overrides,
    totalCost:
      ((overrides.quantity ?? base.quantity) +
        (overrides.spareQuantity ?? base.spareQuantity)) *
      (overrides.unitCost ?? base.unitCost),
  };
}

export function formatEquipmentUsd(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
