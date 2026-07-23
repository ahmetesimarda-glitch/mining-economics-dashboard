/**
 * Production / deploy entrypoint: ensure Commodity + Country master data.
 * Does not touch mining projects or equipment catalog. Safe to run repeatedly.
 */
import { PrismaClient } from '@prisma/client';
import {
  seedCommodityCatalogIdempotent,
  seedCountryCatalogIdempotent,
} from '../lib/master-data';

const prisma = new PrismaClient();

async function main() {
  const commodity = await seedCommodityCatalogIdempotent(prisma);
  const country = await seedCountryCatalogIdempotent(prisma);
  const commodityInDb = await prisma.commodityCatalogItem.count();
  const countryInDb = await prisma.countryCatalogItem.count();
  console.log(
    `\u2705 Commodity catalog ensure: total=${commodity.total} created=${commodity.created} updated=${commodity.updated} alreadyComplete=${commodity.alreadyComplete} totalInDb=${commodityInDb}`
  );
  console.log(
    `\u2705 Country catalog ensure: total=${country.total} created=${country.created} updated=${country.updated} alreadyComplete=${country.alreadyComplete} totalInDb=${countryInDb}`
  );
}

main()
  .catch((error: unknown) => {
    console.error('Commodity/Country catalog seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
