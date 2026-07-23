/**
 * Navigation registry for Master Data catalogs.
 * Add a row here when a new catalog UI ships — header dropdown stays in sync.
 */

import type { MasterDataCatalogKind } from './catalog-kinds';

export interface NavCatalogItem {
  kind: MasterDataCatalogKind;
  href: string;
  /** i18n key under nav.* */
  labelKey: string;
}

/** Implemented catalogs shown under Catalogs ▼ — order matches product nav. */
export const NAV_IMPLEMENTED_CATALOGS: readonly NavCatalogItem[] = [
  {
    kind: 'equipment',
    href: '/master-data/equipment',
    labelKey: 'nav.equipmentCatalog',
  },
  {
    kind: 'commodity',
    href: '/master-data/commodity',
    labelKey: 'nav.commodityCatalog',
  },
  {
    kind: 'country',
    href: '/master-data/country',
    labelKey: 'nav.countryCatalog',
  },
] as const;

export function isCatalogNavPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return NAV_IMPLEMENTED_CATALOGS.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}
