export { MASTER_DATA_CATALOG_KINDS, IMPLEMENTED_MASTER_DATA_CATALOGS, isImplementedCatalog } from './catalog-kinds';
export type { MasterDataCatalogKind } from './catalog-kinds';

export type {
  EquipmentCatalogCategory,
  EquipmentCatalogWriteInput,
  EquipmentCatalogListQuery,
  EquipmentCatalogListResult,
  EquipmentPowerType,
  ProjectEquipmentSnapshot,
} from './equipment-types';
export {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_POWER_TYPES,
} from './equipment-types';

export {
  normalizeEquipmentCatalogInput,
  snapshotCatalogToProjectEquipment,
  slugifyEquipmentCode,
  isValidEquipmentCategory,
  isValidPowerType,
} from './equipment-mapper';

export { buildEquipmentCatalogSeedRows } from './equipment-seed-data';
export type { EquipmentCatalogSeedRow } from './equipment-seed-data';
