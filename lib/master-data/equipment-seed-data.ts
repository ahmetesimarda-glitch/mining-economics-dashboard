import { buildSeedRows, type EquipmentCatalogSeedRow } from './seed/helpers';
import { ALL_COMPACT_EQUIPMENT } from './seed/datasets';

export type { EquipmentCatalogSeedRow } from './seed/helpers';

export function buildEquipmentCatalogSeedRows(): EquipmentCatalogSeedRow[] {
  return buildSeedRows(ALL_COMPACT_EQUIPMENT);
}
