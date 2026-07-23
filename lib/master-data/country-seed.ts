import type { PrismaClient } from '@prisma/client';
import { buildCountryCatalogSeedRows } from './country-seed-data';

export interface CountryCatalogSeedResult {
  total: number;
  created: number;
  updated: number;
  alreadyComplete: boolean;
}

/**
 * Idempotent Country Catalog seed / ensure.
 * Upserts by stable unique `code`. Never deletes catalog rows.
 */
export async function seedCountryCatalogIdempotent(
  prisma: PrismaClient
): Promise<CountryCatalogSeedResult> {
  const rows = buildCountryCatalogSeedRows();
  const seedCodes = rows.map((r) => r.code);

  const existingSeedCount = await prisma.countryCatalogItem.count({
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
    const existing = await prisma.countryCatalogItem.findUnique({
      where: { code: row.code },
      select: { id: true },
    });

    if (existing) {
      await prisma.countryCatalogItem.update({
        where: { code: row.code },
        data: { ...row },
      });
      updated += 1;
    } else {
      await prisma.countryCatalogItem.create({ data: row });
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
