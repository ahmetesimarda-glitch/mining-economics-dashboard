-- AlterTable
ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "payloadTons" DROP NOT NULL,
ALTER COLUMN "payloadTons" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "bucketCapacityM3" DROP NOT NULL,
ALTER COLUMN "bucketCapacityM3" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "enginePowerKw" DROP NOT NULL,
ALTER COLUMN "enginePowerKw" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "operatingWeightTons" DROP NOT NULL,
ALTER COLUMN "operatingWeightTons" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "purchasePriceUsd" DROP NOT NULL,
ALTER COLUMN "purchasePriceUsd" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "fuelConsumptionLph" DROP NOT NULL,
ALTER COLUMN "fuelConsumptionLph" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "usefulLifeYears" DROP NOT NULL;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "availabilityPct" DROP NOT NULL;

ALTER TABLE "EquipmentCatalogItem" ALTER COLUMN "maintenanceCostUsdYear" DROP NOT NULL,
ALTER COLUMN "maintenanceCostUsdYear" DROP DEFAULT;

ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "imageUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "fuelTankCapacityL" DOUBLE PRECISION;
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "isPriceEstimated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "oemWebsite" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "country" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "notes" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EquipmentCatalogItem" ADD COLUMN "searchAliases" TEXT NOT NULL DEFAULT '';
