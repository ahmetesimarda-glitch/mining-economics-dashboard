import type { PrismaClient } from '@prisma/client';
import { buildEquipmentCatalogSeedRows } from './equipment-seed-data';

/**
 * Idempotent Equipment Catalog seed.
 *
 * - Upserts by stable unique `code` (never deletes).
 * - Inserts missing OEM rows; updates existing seed rows.
 * - Leaves user-created catalog records untouched (different codes).
 * - Safe to run repeatedly against shared / production-adjacent databases.
 */
export async function seedEquipmentCatalogIdempotent(
  prisma: PrismaClient
): Promise<{ upserted: number }> {
  const rows = buildEquipmentCatalogSeedRows();

  for (const row of rows) {
    await prisma.equipmentCatalogItem.upsert({
      where: { code: row.code },
      create: row,
      update: {
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
  }

  return { upserted: rows.length };
}
