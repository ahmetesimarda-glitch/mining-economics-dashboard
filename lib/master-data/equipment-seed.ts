import type { PrismaClient } from '@prisma/client';
import { buildEquipmentCatalogSeedRows } from './equipment-seed-data';

export interface EquipmentCatalogSeedResult {
  /** Seed definition count (445 master rows). */
  total: number;
  created: number;
  updated: number;
  /** Skipped because a non-seed (manual) row already owns manufacturer+model. */
  skippedManual: number;
  /** True when every seed `code` was already present (no writes). */
  alreadyComplete: boolean;
}

/**
 * Idempotent Equipment Catalog seed / ensure.
 *
 * Intentionally does NOT short-circuit on "any rows exist"
 * (there is no `if (count > 0) return` — a single manual test record
 * must never block inserting the commercial master dataset).
 *
 * Strategy:
 * - Fast-path only when ALL seed codes are already present.
 * - Otherwise upsert by stable unique `code` for every seed row.
 * - If `code` is missing but a row already exists with the same
 *   manufacturer + model (case-insensitive) under a different code,
 *   leave that manual row untouched and skip create (no duplicates).
 * - Never deletes catalog rows.
 */
export async function seedEquipmentCatalogIdempotent(
  prisma: PrismaClient
): Promise<EquipmentCatalogSeedResult> {
  const rows = buildEquipmentCatalogSeedRows();
  const seedCodes = rows.map((row) => row.code);

  const existingSeedCount = await prisma.equipmentCatalogItem.count({
    where: { code: { in: seedCodes } },
  });

  if (existingSeedCount === rows.length) {
    return {
      total: rows.length,
      created: 0,
      updated: 0,
      skippedManual: 0,
      alreadyComplete: true,
    };
  }

  let created = 0;
  let updated = 0;
  let skippedManual = 0;

  for (const row of rows) {
    const existingByCode = await prisma.equipmentCatalogItem.findUnique({
      where: { code: row.code },
      select: { id: true },
    });

    if (existingByCode) {
      await prisma.equipmentCatalogItem.update({
        where: { code: row.code },
        data: {
          manufacturer: row.manufacturer,
          model: row.model,
          category: row.category,
          description: row.description,
          imageUrl: row.imageUrl,
          capacityLabel: row.capacityLabel,
          payloadTons: row.payloadTons,
          bucketCapacityM3: row.bucketCapacityM3,
          enginePowerKw: row.enginePowerKw,
          operatingWeightTons: row.operatingWeightTons,
          purchasePriceUsd: row.purchasePriceUsd,
          fuelConsumptionLph: row.fuelConsumptionLph,
          fuelTankCapacityL: row.fuelTankCapacityL,
          usefulLifeYears: row.usefulLifeYears,
          availabilityPct: row.availabilityPct,
          maintenanceCostUsdYear: row.maintenanceCostUsdYear,
          isPriceEstimated: row.isPriceEstimated,
          powerType: row.powerType,
          oemWebsite: row.oemWebsite,
          country: row.country,
          notes: row.notes,
          searchAliases: row.searchAliases,
          isActive: row.isActive,
          sortOrder: row.sortOrder,
        },
      });
      updated += 1;
      continue;
    }

    // Preserve manually created rows that share manufacturer+model but not seed code.
    const existingManual = await prisma.equipmentCatalogItem.findFirst({
      where: {
        manufacturer: { equals: row.manufacturer, mode: 'insensitive' },
        model: { equals: row.model, mode: 'insensitive' },
        NOT: { code: row.code },
      },
      select: { id: true, code: true },
    });

    if (existingManual) {
      skippedManual += 1;
      continue;
    }

    await prisma.equipmentCatalogItem.create({ data: row });
    created += 1;
  }

  return {
    total: rows.length,
    created,
    updated,
    skippedManual,
    alreadyComplete: false,
  };
}
