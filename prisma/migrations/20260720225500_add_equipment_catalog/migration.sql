-- CreateTable
CREATE TABLE "EquipmentCatalogItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "capacityLabel" TEXT NOT NULL DEFAULT '',
    "payloadTons" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bucketCapacityM3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enginePowerKw" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operatingWeightTons" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchasePriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelConsumptionLph" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usefulLifeYears" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "availabilityPct" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "maintenanceCostUsdYear" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "powerType" TEXT NOT NULL DEFAULT 'diesel',
    "extraSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentCatalogItem_code_key" ON "EquipmentCatalogItem"("code");

-- CreateIndex
CREATE INDEX "EquipmentCatalogItem_category_idx" ON "EquipmentCatalogItem"("category");

-- CreateIndex
CREATE INDEX "EquipmentCatalogItem_isActive_idx" ON "EquipmentCatalogItem"("isActive");

-- CreateIndex
CREATE INDEX "EquipmentCatalogItem_manufacturer_idx" ON "EquipmentCatalogItem"("manufacturer");

-- CreateIndex
CREATE INDEX "EquipmentCatalogItem_model_idx" ON "EquipmentCatalogItem"("model");
