/**
 * Shared DTOs for the Equipment Catalog (Master Data).
 * Keep API request/response shapes here — do not redefine in routes or UI.
 */

export const EQUIPMENT_CATALOG_CATEGORIES = [
  'truck',
  'excavator',
  'loader',
  'dozer',
  'grader',
  'drill',
  'underground',
  'crusher',
  'support',
  'general',
] as const;

export type EquipmentCatalogCategory = (typeof EQUIPMENT_CATALOG_CATEGORIES)[number];

export const EQUIPMENT_POWER_TYPES = ['diesel', 'electric', 'hybrid'] as const;
export type EquipmentPowerType = (typeof EQUIPMENT_POWER_TYPES)[number];

/** Writable fields accepted by create/update APIs (excludes id/timestamps). */
export interface EquipmentCatalogWriteInput {
  code?: string;
  manufacturer?: string;
  model?: string;
  category?: string;
  description?: string;
  capacityLabel?: string;
  payloadTons?: number;
  bucketCapacityM3?: number;
  enginePowerKw?: number;
  operatingWeightTons?: number;
  purchasePriceUsd?: number;
  fuelConsumptionLph?: number;
  usefulLifeYears?: number;
  availabilityPct?: number;
  maintenanceCostUsdYear?: number;
  powerType?: string;
  extraSpecs?: Record<string, unknown> | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface EquipmentCatalogListQuery {
  q?: string;
  category?: string;
  manufacturer?: string;
  isActive?: boolean | 'all';
  page?: number;
  pageSize?: number;
  sort?: 'model' | 'manufacturer' | 'category' | 'purchasePriceUsd' | 'updatedAt' | 'sortOrder';
  order?: 'asc' | 'desc';
}

export interface EquipmentCatalogListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Snapshot shape copied into a project Equipment row (no catalog FK). */
export interface ProjectEquipmentSnapshot {
  machineType: string;
  model: string;
  tonnageCapacity: string;
  quantity: number;
  spareQuantity: number;
  fuelConsumption: number;
  maintenanceCost: number;
  unitCost: number;
  totalCost: number;
  isCustom: boolean;
  equipmentCategory: string;
  dailyWorkHours: number;
  maintenancePeriodHours: number;
  operatorCount: number;
  powerType: string;
  hourlyFuelConsumption: number;
  productionImpact: number;
  drillCapacity: number;
  holeDiameter: number;
  maxDrillDepth: number;
  bucketVolume: number;
  transportCapacity: number;
  loadingCapacity: number;
  crushingCapacity: number;
  gallerySuitability: string;
}
