export {
  MASTER_DATA_CATALOG_KINDS,
  IMPLEMENTED_MASTER_DATA_CATALOGS,
  isImplementedCatalog,
} from './catalog-kinds';
export type { MasterDataCatalogKind } from './catalog-kinds';

export type {
  EquipmentCatalogCategory,
  EquipmentCatalogWriteInput,
  EquipmentCatalogListQuery,
  EquipmentCatalogListResult,
  EquipmentCatalogFacets,
  EquipmentCatalogItemDto,
  EquipmentCatalogFormState,
  EquipmentPowerType,
  EquipmentOemManufacturer,
  ProjectEquipmentSnapshot,
  CatalogSnapshotSource,
  EquipmentCatalogViewMode,
} from './types';
export {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
  EQUIPMENT_OEM_MANUFACTURERS,
} from './types';

export {
  normalizeEquipmentCatalogInput,
  slugifyEquipmentCode,
  isValidEquipmentCategory,
  isValidPowerType,
  toOptionalJsonInput,
  toEquipmentCatalogPrismaData,
} from './validation';
export type { NormalizedEquipmentCatalogWrite } from './validation';

export {
  snapshotCatalogToProjectEquipment,
  equipmentCatalogItemToForm,
  equipmentCatalogFormToPayload,
  EMPTY_EQUIPMENT_CATALOG_FORM,
  formatEquipmentUsd,
  formatSpecNumber,
} from './mapper';

export {
  expandEquipmentSearchTerms,
  tokenizeEquipmentSearch,
} from './search';

export {
  buildEquipmentCatalogWhere,
  equipmentFiltersToSearchParams,
  type EquipmentCatalogFilterInput,
  type EquipmentCatalogListParams,
} from './filters';

export { buildEquipmentCatalogSeedRows } from './equipment-seed-data';
export type { EquipmentCatalogSeedRow } from './equipment-seed-data';
export { seedEquipmentCatalogIdempotent } from './equipment-seed';
