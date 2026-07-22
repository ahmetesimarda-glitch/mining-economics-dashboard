import type { Prisma } from '@prisma/client';
import { expandEquipmentSearchTerms } from './search';

/**
 * Extensible filter bag for Equipment Catalog list queries.
 * Add new optional keys here (and wire them in buildEquipmentCatalogWhere)
 * without changing UI/API contracts for existing filters.
 */
export interface EquipmentCatalogFilterInput {
  q?: string | null;
  category?: string | null;
  manufacturer?: string | null;
  powerType?: string | null;
  isActive?: string | null;
}

export interface EquipmentCatalogListParams extends EquipmentCatalogFilterInput {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: string;
}

function parseActive(value: string | null | undefined): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return undefined;
}

/** Fields searched for the user's raw token (partial text). */
function textMatchFields(term: string): Prisma.EquipmentCatalogItemWhereInput[] {
  return [
    { manufacturer: { contains: term, mode: 'insensitive' } },
    { model: { contains: term, mode: 'insensitive' } },
    { category: { contains: term, mode: 'insensitive' } },
    { description: { contains: term, mode: 'insensitive' } },
    { capacityLabel: { contains: term, mode: 'insensitive' } },
    { code: { contains: term, mode: 'insensitive' } },
    { country: { contains: term, mode: 'insensitive' } },
    { searchAliases: { contains: term, mode: 'insensitive' } },
  ];
}

/** OEM alias expansions only hit manufacturer / searchAliases (not notes/description). */
function oemAliasFields(term: string): Prisma.EquipmentCatalogItemWhereInput[] {
  return [
    { manufacturer: { contains: term, mode: 'insensitive' } },
    { searchAliases: { contains: term, mode: 'insensitive' } },
  ];
}

/**
 * Build a Prisma where clause from catalog filters.
 * New filters can be appended here without touching route handlers' HTTP parsing.
 */
export function buildEquipmentCatalogWhere(
  filters: EquipmentCatalogFilterInput
): Prisma.EquipmentCatalogItemWhereInput {
  const where: Prisma.EquipmentCatalogItemWhereInput = {};
  const and: Prisma.EquipmentCatalogItemWhereInput[] = [];

  const category = filters.category?.trim();
  if (category && category !== 'all') {
    where.category = category;
  }

  const manufacturer = filters.manufacturer?.trim();
  if (manufacturer && manufacturer !== 'all') {
    where.manufacturer = { equals: manufacturer, mode: 'insensitive' };
  }

  const powerType = filters.powerType?.trim();
  if (powerType && powerType !== 'all') {
    where.powerType = { equals: powerType, mode: 'insensitive' };
  }

  const isActive = parseActive(filters.isActive ?? null);
  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  const raw = (filters.q ?? '').trim();
  if (raw) {
    const tokens = raw.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const aliases = expandEquipmentSearchTerms(token);
      const aliasOnly = aliases.filter(
        (alias) => alias.toLowerCase() !== token.toLowerCase()
      );
      and.push({
        OR: [
          ...textMatchFields(token),
          ...aliasOnly.flatMap((alias) => oemAliasFields(alias)),
        ],
      });
    }
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

/** Serialize UI filter state into list API query params. */
export function equipmentFiltersToSearchParams(
  filters: EquipmentCatalogListParams
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }
  if (filters.manufacturer && filters.manufacturer !== 'all') {
    params.set('manufacturer', filters.manufacturer);
  }
  if (filters.powerType && filters.powerType !== 'all') {
    params.set('powerType', filters.powerType);
  }
  if (filters.isActive && filters.isActive !== 'all') {
    params.set('isActive', filters.isActive);
  }
  return params;
}
