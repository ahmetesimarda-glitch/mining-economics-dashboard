/**
 * Master Data catalog registry.
 * Equipment, Commodity, and Country are implemented; other kinds remain
 * reserved so future catalogs plug into the same module/API/UI conventions.
 */

export const MASTER_DATA_CATALOG_KINDS = [
  'equipment',
  'commodity',
  'country',
  'currency',
  'units',
  'fuelTypes',
  'processingMethods',
  'labourCategories',
] as const;

export type MasterDataCatalogKind = (typeof MASTER_DATA_CATALOG_KINDS)[number];

export const IMPLEMENTED_MASTER_DATA_CATALOGS: readonly MasterDataCatalogKind[] = [
  'equipment',
  'commodity',
  'country',
] as const;

export function isImplementedCatalog(kind: string): kind is MasterDataCatalogKind {
  return (IMPLEMENTED_MASTER_DATA_CATALOGS as readonly string[]).includes(kind);
}
