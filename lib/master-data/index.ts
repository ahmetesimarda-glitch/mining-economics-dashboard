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
  EquipmentCatalogItemDto,
  EquipmentCatalogFormState,
  EquipmentPowerType,
  ProjectEquipmentSnapshot,
  CatalogSnapshotSource,
} from './types';
export {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
} from './types';

export {
  normalizeEquipmentCatalogInput,
  slugifyEquipmentCode,
  isValidEquipmentCategory,
  isValidPowerType,
  toOptionalJsonInput,
} from './validation';
export type { NormalizedEquipmentCatalogWrite } from './validation';

export {
  snapshotCatalogToProjectEquipment,
  equipmentCatalogItemToForm,
  equipmentCatalogFormToPayload,
  EMPTY_EQUIPMENT_CATALOG_FORM,
  formatEquipmentUsd,
} from './mapper';

export { buildEquipmentCatalogSeedRows } from './equipment-seed-data';
export type { EquipmentCatalogSeedRow } from './equipment-seed-data';
