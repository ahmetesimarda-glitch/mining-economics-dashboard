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
  'waterTruck',
  'serviceTruck',
  'support',
  'underground',
  'undergroundTruck',
  'undergroundLoader',
  'jumbo',
  'bolter',
  'shotcrete',
  'scaler',
  'crusher',
  'screen',
  'mill',
  'conveyor',
  'stacker',
  'pump',
  'compressor',
  'thickener',
  'general',
] as const;

export type EquipmentCatalogCategory = (typeof EQUIPMENT_CATALOG_CATEGORIES)[number];

export const EQUIPMENT_POWER_TYPES = ['diesel', 'electric', 'hybrid'] as const;
export type EquipmentPowerType = (typeof EQUIPMENT_POWER_TYPES)[number];

/** Canonical OEM display names used in seed + manufacturer filter. */
export const EQUIPMENT_OEM_MANUFACTURERS = [
  'Caterpillar',
  'Komatsu',
  'Liebherr',
  'Hitachi',
  'Volvo CE',
  'Sandvik',
  'Epiroc',
  'Atlas Copco',
  'Metso',
  'FLSmidth',
  'Normet',
  'MacLean',
  'Bell',
  'XCMG',
  'SANY',
] as const;

export type EquipmentOemManufacturer = (typeof EQUIPMENT_OEM_MANUFACTURERS)[number];

/** Writable fields accepted by create/update APIs (excludes id/timestamps). */
export interface EquipmentCatalogWriteInput {
  code?: string;
  manufacturer?: string;
  model?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  capacityLabel?: string;
  payloadTons?: number | null;
  bucketCapacityM3?: number | null;
  enginePowerKw?: number | null;
  operatingWeightTons?: number | null;
  purchasePriceUsd?: number | null;
  fuelConsumptionLph?: number | null;
  fuelTankCapacityL?: number | null;
  usefulLifeYears?: number | null;
  availabilityPct?: number | null;
  maintenanceCostUsdYear?: number | null;
  isPriceEstimated?: boolean;
  powerType?: string;
  oemWebsite?: string;
  country?: string;
  notes?: string;
  searchAliases?: string;
  extraSpecs?: Record<string, unknown> | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface EquipmentCatalogListQuery {
  q?: string;
  category?: string;
  manufacturer?: string;
  powerType?: string;
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

export interface EquipmentCatalogFacets {
  manufacturers: string[];
  categories: string[];
  /** Extensible facet bag — UI may ignore unused keys. */
  activeStatuses: boolean[];
}

export type EquipmentCatalogViewMode = 'table' | 'card';

/** API/list row shape returned to the catalog UI (dates as ISO strings over JSON). */
export interface EquipmentCatalogItemDto {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

/** Controlled form draft for create/edit dialogs (numeric fields as strings while editing). */
export interface EquipmentCatalogFormState {
  code: string;
  manufacturer: string;
  model: string;
  category: string;
  description: string;
  imageUrl: string;
  capacityLabel: string;
  payloadTons: string;
  bucketCapacityM3: string;
  enginePowerKw: string;
  operatingWeightTons: string;
  purchasePriceUsd: string;
  fuelConsumptionLph: string;
  fuelTankCapacityL: string;
  usefulLifeYears: string;
  availabilityPct: string;
  maintenanceCostUsdYear: string;
  isPriceEstimated: boolean;
  powerType: string;
  oemWebsite: string;
  country: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: string;
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

export type CatalogSnapshotSource = {
  manufacturer: string;
  model: string;
  category: string;
  capacityLabel: string;
  payloadTons: number | null;
  bucketCapacityM3: number | null;
  purchasePriceUsd: number | null;
  fuelConsumptionLph: number | null;
  maintenanceCostUsdYear: number | null;
  powerType: string;
};
