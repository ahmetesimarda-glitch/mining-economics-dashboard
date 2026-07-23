/**
 * Production / deploy entrypoint: ensure Equipment Catalog master data only.
 * Does not touch mining projects. Safe to run repeatedly.
 *
 * Usage:
 *   tsx --require dotenv/config scripts/seed-equipment-catalog.ts
 */
import { PrismaClient } from '@prisma/client';
import { seedEquipmentCatalogIdempotent } from '../lib/master-data';

const prisma = new PrismaClient();

async function main() {
  const result = await seedEquipmentCatalogIdempotent(prisma);
  const totalInDb = await prisma.equipmentCatalogItem.count();
  console.log(
    `\u2705 Equipment catalog ensure: total=${result.total} created=${result.created} updated=${result.updated} skippedManual=${result.skippedManual} alreadyComplete=${result.alreadyComplete} totalInDb=${totalInDb}`
  );
}

main()
  .catch((error: unknown) => {
    console.error('Equipment catalog seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
