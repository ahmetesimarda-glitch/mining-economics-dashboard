export const RISK_LEVELS = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface CommodityCatalogItemDto {
  id: string;
  code: string;
  name: string;
  nameTr: string;
  symbol: string;
  unit: string;
  typicalSellingUnit: string;
  typicalPriceUsd: number | null;
  priceCurrency: string;
  gradeMin: number | null;
  gradeMax: number | null;
  gradeUnit: string;
  recoveryMinPct: number | null;
  recoveryMaxPct: number | null;
  densityTPerM3: number | null;
  typicalProcessingMethod: string;
  typicalMiningMethods: string;
  typicalMineLifeYears: number | null;
  refiningCostUsdPerT: number | null;
  smeltingCostUsdPerT: number | null;
  payabilityPct: number | null;
  transportationCostUsdPerT: number | null;
  royaltyDefaultPct: number | null;
  environmentalRisk: string;
  colorHex: string;
  iconKey: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CommodityCatalogListResult {
  items: CommodityCatalogItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CommodityCatalogWriteInput {
  code?: string;
  name: string;
  nameTr?: string;
  symbol?: string;
  unit?: string;
  typicalSellingUnit?: string;
  typicalPriceUsd?: number | null;
  priceCurrency?: string;
  gradeMin?: number | null;
  gradeMax?: number | null;
  gradeUnit?: string;
  recoveryMinPct?: number | null;
  recoveryMaxPct?: number | null;
  densityTPerM3?: number | null;
  typicalProcessingMethod?: string;
  typicalMiningMethods?: string;
  typicalMineLifeYears?: number | null;
  refiningCostUsdPerT?: number | null;
  smeltingCostUsdPerT?: number | null;
  payabilityPct?: number | null;
  transportationCostUsdPerT?: number | null;
  royaltyDefaultPct?: number | null;
  environmentalRisk?: string;
  colorHex?: string;
  iconKey?: string;
  notes?: string;
  searchAliases?: string;
  isActive?: boolean;
  sortOrder?: number;
}
