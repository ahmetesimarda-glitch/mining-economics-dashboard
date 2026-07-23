/**
 * Compose MiningProject scalar defaults from Commodity + Country master data.
 *
 * Pure / side-effect free — reusable by the new-project form, APIs, Fleet
 * Planning, Decision Insights, Benchmarking, and Cost Forecasting.
 *
 * Snapshot semantics: callers copy returned fields into the project; there is
 * no live FK. Catalog edits never rewrite historical projects.
 *
 * Precedence:
 *  1. Commodity engineering defaults (price, grade, life, production unit, …)
 *  2. Country fiscal / energy / rehab defaults override overlapping fields
 *     (tax, royalty, discount, fuel, electricity, currency, exchange, rehab)
 *  3. Explicit miningMethod argument wins over commodity typical methods
 */

export interface CommodityDefaultsSource {
  code: string;
  name: string;
  nameTr?: string;
  typicalPriceUsd: number | null;
  gradeMin: number | null;
  gradeMax: number | null;
  gradeUnit: string;
  recoveryMinPct: number | null;
  recoveryMaxPct: number | null;
  typicalMineLifeYears: number | null;
  typicalMiningMethods: string;
  royaltyDefaultPct: number | null;
  transportationCostUsdPerT: number | null;
  refiningCostUsdPerT: number | null;
  smeltingCostUsdPerT: number | null;
  unit: string;
  typicalSellingUnit: string;
}

export interface CountryDefaultsSource {
  code: string;
  name: string;
  nameTr?: string;
  currencyCode: string;
  corporateTaxPct: number | null;
  royaltyPct: number | null;
  discountRateRecommendation: number | null;
  dieselPriceUsdPerLiter: number | null;
  electricityCostUsdPerKwh: number | null;
  waterCostUsdPerM3: number | null;
  exchangeRateToUsd: number | null;
  typicalRehabilitationCostUsdPerHa: number | null;
  inflationPct: number | null;
}

/** Subset of project form / MiningProject scalars filled from master data. */
export interface ProjectMasterDefaults {
  mineType: string;
  countryCode: string;
  unitPrice?: number;
  oreGrade?: number;
  oreGradeUnit?: string;
  productionUnit?: string;
  projectLifeYears?: number;
  miningMethod?: string;
  royaltyRate?: number;
  taxRate?: number;
  discountRate?: number;
  fuelPricePerLiter?: number;
  electricityUnitPrice?: number;
  currency?: string;
  exchangeRate?: number;
  manualExchangeRate?: boolean;
  rehabilitationCostPerHa?: number;
  /** Soft location hint when location is empty (country display name). */
  locationHint?: string;
  /** Mid-point recovery % — informational; not a MiningProject column today. */
  recoveryPct?: number;
  /** Plant opex hint from refining+smelting (USD/t product) — informational. */
  treatmentCostUsdPerT?: number;
  /** Applied keys for UI messaging. */
  appliedFrom: {
    commodity: boolean;
    country: boolean;
  };
}

function mid(min: number | null | undefined, max: number | null | undefined): number | undefined {
  if (min == null && max == null) return undefined;
  if (min == null) return max ?? undefined;
  if (max == null) return min ?? undefined;
  return (min + max) / 2;
}

function firstMiningMethod(methods: string): 'openPit' | 'underground' | undefined {
  const parts = methods
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.includes('openPit')) return 'openPit';
  if (parts.includes('underground')) return 'underground';
  return undefined;
}

function productionUnitFromCommodity(c: CommodityDefaultsSource): string {
  const selling = c.typicalSellingUnit.toLowerCase();
  if (selling.includes('/oz') || c.unit === 'oz') return 'koz';
  if (selling.includes('/lb') || c.unit === 'lb') return 'Mlb';
  if (selling.includes('kg')) return 't';
  // Bulk commodities commonly modelled in Mt/y in this app
  if (['iron', 'coal', 'lignite', 'bauxite', 'phosphate', 'potash'].includes(c.code)) {
    return 'Mt';
  }
  return 'kt';
}

export function composeProjectDefaultsFromMasterData(
  commodity: CommodityDefaultsSource | null | undefined,
  country: CountryDefaultsSource | null | undefined,
  options?: { miningMethod?: string; locale?: 'en' | 'tr' }
): ProjectMasterDefaults {
  const result: ProjectMasterDefaults = {
    mineType: commodity?.code ?? '',
    countryCode: country?.code ?? '',
    appliedFrom: {
      commodity: Boolean(commodity),
      country: Boolean(country),
    },
  };

  if (commodity) {
    if (commodity.typicalPriceUsd != null) {
      result.unitPrice = commodity.typicalPriceUsd;
    }
    const grade = mid(commodity.gradeMin, commodity.gradeMax);
    if (grade != null) result.oreGrade = Number(grade.toFixed(4));
    if (commodity.gradeUnit) result.oreGradeUnit = commodity.gradeUnit;
    result.productionUnit = productionUnitFromCommodity(commodity);
    if (commodity.typicalMineLifeYears != null) {
      result.projectLifeYears = commodity.typicalMineLifeYears;
    }
    if (commodity.royaltyDefaultPct != null) {
      result.royaltyRate = commodity.royaltyDefaultPct;
    }
    const recovery = mid(commodity.recoveryMinPct, commodity.recoveryMaxPct);
    if (recovery != null) result.recoveryPct = Number(recovery.toFixed(2));

    const treatment =
      (commodity.refiningCostUsdPerT ?? 0) + (commodity.smeltingCostUsdPerT ?? 0);
    if (treatment > 0) result.treatmentCostUsdPerT = treatment;

    if (!options?.miningMethod) {
      const method = firstMiningMethod(commodity.typicalMiningMethods);
      if (method) result.miningMethod = method;
    }
  }

  if (options?.miningMethod === 'openPit' || options?.miningMethod === 'underground') {
    result.miningMethod = options.miningMethod;
  }

  if (country) {
    if (country.corporateTaxPct != null) result.taxRate = country.corporateTaxPct;
    if (country.royaltyPct != null) result.royaltyRate = country.royaltyPct;
    if (country.discountRateRecommendation != null) {
      result.discountRate = country.discountRateRecommendation;
    }
    if (country.dieselPriceUsdPerLiter != null) {
      result.fuelPricePerLiter = country.dieselPriceUsdPerLiter;
    }
    if (country.electricityCostUsdPerKwh != null) {
      result.electricityUnitPrice = country.electricityCostUsdPerKwh;
    }
    if (country.currencyCode) result.currency = country.currencyCode;
    if (country.exchangeRateToUsd != null) {
      result.exchangeRate = country.exchangeRateToUsd;
      result.manualExchangeRate = country.currencyCode !== 'USD';
    }
    if (country.typicalRehabilitationCostUsdPerHa != null) {
      result.rehabilitationCostPerHa = country.typicalRehabilitationCostUsdPerHa;
    }
    const locale = options?.locale ?? 'en';
    result.locationHint =
      locale === 'tr' && country.nameTr ? country.nameTr : country.name;
  }

  return result;
}

/** Keys that the new-project form may overwrite when master data changes. */
export const PROJECT_DEFAULT_FORM_KEYS = [
  'mineType',
  'countryCode',
  'unitPrice',
  'oreGrade',
  'oreGradeUnit',
  'productionUnit',
  'projectLifeYears',
  'miningMethod',
  'royaltyRate',
  'taxRate',
  'discountRate',
  'fuelPricePerLiter',
  'electricityUnitPrice',
  'currency',
  'exchangeRate',
  'manualExchangeRate',
  'rehabilitationCostPerHa',
] as const;

export type ProjectDefaultFormKey = (typeof PROJECT_DEFAULT_FORM_KEYS)[number];
