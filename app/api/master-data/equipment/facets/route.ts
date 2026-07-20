import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  EQUIPMENT_CATALOG_CATEGORIES,
  EQUIPMENT_OEM_MANUFACTURERS,
  type EquipmentCatalogFacets,
} from '@/lib/master-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/master-data/equipment/facets
 * Distinct filter options for manufacturer / category / active status.
 * Designed so additional facet dimensions can be added later without new routes.
 */
export async function GET() {
  try {
    const [manufacturersRaw, categoriesRaw] = await Promise.all([
      prisma.equipmentCatalogItem.findMany({
        distinct: ['manufacturer'],
        select: { manufacturer: true },
        orderBy: { manufacturer: 'asc' },
      }),
      prisma.equipmentCatalogItem.findMany({
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);

    const manufacturerSet = new Set<string>([
      ...EQUIPMENT_OEM_MANUFACTURERS,
      ...manufacturersRaw.map((row) => row.manufacturer).filter(Boolean),
    ]);

    const categorySet = new Set<string>([
      ...EQUIPMENT_CATALOG_CATEGORIES,
      ...categoriesRaw.map((row) => row.category).filter(Boolean),
    ]);

    const knownCategories = EQUIPMENT_CATALOG_CATEGORIES.filter((c) =>
      categorySet.has(c)
    );
    const extraCategories = Array.from(categorySet).filter(
      (c) => !(EQUIPMENT_CATALOG_CATEGORIES as readonly string[]).includes(c)
    );

    const facets: EquipmentCatalogFacets = {
      manufacturers: Array.from(manufacturerSet).sort((a, b) => a.localeCompare(b)),
      categories: [...knownCategories, ...extraCategories],
      activeStatuses: [true, false],
    };

    return NextResponse.json(facets);
  } catch (error: unknown) {
    console.error('Equipment catalog facets:', error);
    const fallback: EquipmentCatalogFacets = {
      manufacturers: [...EQUIPMENT_OEM_MANUFACTURERS],
      categories: [...EQUIPMENT_CATALOG_CATEGORIES],
      activeStatuses: [true, false],
    };
    return NextResponse.json(fallback);
  }
}
