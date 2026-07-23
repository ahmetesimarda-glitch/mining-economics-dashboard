-- AlterTable: snapshot country code on projects (additive; no live FK)
ALTER TABLE "MiningProject" ADD COLUMN IF NOT EXISTS "countryCode" TEXT NOT NULL DEFAULT '';

-- CreateTable: Commodity Master Data
CREATE TABLE IF NOT EXISTS "CommodityCatalogItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL DEFAULT '',
    "symbol" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 't',
    "typicalSellingUnit" TEXT NOT NULL DEFAULT 'USD/t',
    "typicalPriceUsd" DOUBLE PRECISION,
    "priceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "gradeMin" DOUBLE PRECISION,
    "gradeMax" DOUBLE PRECISION,
    "gradeUnit" TEXT NOT NULL DEFAULT '%',
    "recoveryMinPct" DOUBLE PRECISION,
    "recoveryMaxPct" DOUBLE PRECISION,
    "densityTPerM3" DOUBLE PRECISION,
    "typicalProcessingMethod" TEXT NOT NULL DEFAULT '',
    "typicalMiningMethods" TEXT NOT NULL DEFAULT 'openPit',
    "typicalMineLifeYears" INTEGER,
    "refiningCostUsdPerT" DOUBLE PRECISION,
    "smeltingCostUsdPerT" DOUBLE PRECISION,
    "payabilityPct" DOUBLE PRECISION,
    "transportationCostUsdPerT" DOUBLE PRECISION,
    "royaltyDefaultPct" DOUBLE PRECISION,
    "environmentalRisk" TEXT NOT NULL DEFAULT 'medium',
    "colorHex" TEXT NOT NULL DEFAULT '#64748b',
    "iconKey" TEXT NOT NULL DEFAULT 'gem',
    "notes" TEXT NOT NULL DEFAULT '',
    "searchAliases" TEXT NOT NULL DEFAULT '',
    "extraSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommodityCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Country Master Data
CREATE TABLE IF NOT EXISTS "CountryCatalogItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameTr" TEXT NOT NULL DEFAULT '',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "corporateTaxPct" DOUBLE PRECISION,
    "royaltyPct" DOUBLE PRECISION,
    "inflationPct" DOUBLE PRECISION,
    "discountRateRecommendation" DOUBLE PRECISION,
    "dieselPriceUsdPerLiter" DOUBLE PRECISION,
    "electricityCostUsdPerKwh" DOUBLE PRECISION,
    "waterCostUsdPerM3" DOUBLE PRECISION,
    "laborCostIndex" DOUBLE PRECISION,
    "exchangeRateToUsd" DOUBLE PRECISION,
    "environmentalCostIndex" DOUBLE PRECISION,
    "infrastructureRating" DOUBLE PRECISION,
    "miningInvestmentRisk" TEXT NOT NULL DEFAULT 'medium',
    "esgDifficulty" TEXT NOT NULL DEFAULT 'medium',
    "typicalPermittingYears" DOUBLE PRECISION,
    "typicalRehabilitationCostUsdPerHa" DOUBLE PRECISION,
    "politicalRisk" TEXT NOT NULL DEFAULT 'medium',
    "notes" TEXT NOT NULL DEFAULT '',
    "searchAliases" TEXT NOT NULL DEFAULT '',
    "extraSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommodityCatalogItem_code_key" ON "CommodityCatalogItem"("code");
CREATE INDEX IF NOT EXISTS "CommodityCatalogItem_isActive_idx" ON "CommodityCatalogItem"("isActive");
CREATE INDEX IF NOT EXISTS "CommodityCatalogItem_name_idx" ON "CommodityCatalogItem"("name");
CREATE INDEX IF NOT EXISTS "CommodityCatalogItem_sortOrder_idx" ON "CommodityCatalogItem"("sortOrder");

CREATE UNIQUE INDEX IF NOT EXISTS "CountryCatalogItem_code_key" ON "CountryCatalogItem"("code");
CREATE INDEX IF NOT EXISTS "CountryCatalogItem_isActive_idx" ON "CountryCatalogItem"("isActive");
CREATE INDEX IF NOT EXISTS "CountryCatalogItem_name_idx" ON "CountryCatalogItem"("name");
CREATE INDEX IF NOT EXISTS "CountryCatalogItem_sortOrder_idx" ON "CountryCatalogItem"("sortOrder");
