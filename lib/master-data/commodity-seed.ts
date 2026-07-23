import type { PrismaClient } from '@prisma/client';
import { buildCommodityCatalogSeedRows } from './commodity-seed-data';

export interface CommodityCatalogSeedResult {
  total: number;
  created: number;
  updated: number;
  alreadyComplete: boolean;
}

/**
 * Idempotent Commodity Catalog seed / ensure.
 * Upserts by stable unique `code`. Never deletes catalog rows.
 */
export async function seedCommodityCatalogIdempotent(
  prisma: PrismaClient
): Promise<CommodityCatalogSeedResult> {
  const rows = buildCommodityCatalogSeedRows();
  const seedCodes = rows.map((r) => r.code);

  const existingSeedCount = await prisma.commodityCatalogItem.count({
    where: { code: { in: seedCodes } },
  });

  if (existingSeedCount === rows.length) {
    return {
      total: rows.length,
      created: 0,
      updated: 0,
      alreadyComplete: true,
    };
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.commodityCatalogItem.findUnique({
      where: { code: row.code },
      select: { id: true },
    });

    if (existing) {
      await prisma.commodityCatalogItem.update({
        where: { code: row.code },
        data: { ...row },
      });
      updated += 1;
    } else {
      await prisma.commodityCatalogItem.create({ data: row });
      created += 1;
    }
  }

  return {
    total: rows.length,
    created,
    updated,
    alreadyComplete: false,
  };
}
