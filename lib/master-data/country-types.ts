export interface CountryCatalogItemDto {
  id: string;
  code: string;
  name: string;
  nameTr: string;
  currencyCode: string;
  corporateTaxPct: number | null;
  royaltyPct: number | null;
  inflationPct: number | null;
  discountRateRecommendation: number | null;
  dieselPriceUsdPerLiter: number | null;
  electricityCostUsdPerKwh: number | null;
  waterCostUsdPerM3: number | null;
  laborCostIndex: number | null;
  exchangeRateToUsd: number | null;
  environmentalCostIndex: number | null;
  infrastructureRating: number | null;
  miningInvestmentRisk: string;
  esgDifficulty: string;
  typicalPermittingYears: number | null;
  typicalRehabilitationCostUsdPerHa: number | null;
  politicalRisk: string;
  notes: string;
  searchAliases: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CountryCatalogListResult {
  items: CountryCatalogItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CountryCatalogWriteInput {
  code: string;
  name: string;
  nameTr?: string;
  currencyCode?: string;
  corporateTaxPct?: number | null;
  royaltyPct?: number | null;
  inflationPct?: number | null;
  discountRateRecommendation?: number | null;
  dieselPriceUsdPerLiter?: number | null;
  electricityCostUsdPerKwh?: number | null;
  waterCostUsdPerM3?: number | null;
  laborCostIndex?: number | null;
  exchangeRateToUsd?: number | null;
  environmentalCostIndex?: number | null;
  infrastructureRating?: number | null;
  miningInvestmentRisk?: string;
  esgDifficulty?: string;
  typicalPermittingYears?: number | null;
  typicalRehabilitationCostUsdPerHa?: number | null;
  politicalRisk?: string;
  notes?: string;
  searchAliases?: string;
  isActive?: boolean;
  sortOrder?: number;
}
