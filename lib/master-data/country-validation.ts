import type { CountryCatalogWriteInput } from './country-types';

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function normalizeRisk(v: unknown, fallback = 'medium'): string {
  const s = str(v, fallback).toLowerCase();
  return ['low', 'medium', 'high'].includes(s) ? s : fallback;
}

export interface NormalizedCountryWrite {
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
}

export function normalizeCountryCatalogInput(
  body: unknown
): { data: NormalizedCountryWrite; error?: undefined } | { data?: undefined; error: string } {
  const r = asRecord(body);
  const name = str(r.name);
  const code = str(r.code).toUpperCase();
  if (!name) return { error: 'Country name is required' };
  if (!code || code.length < 2) return { error: 'Country code is required (ISO-style, e.g. CL)' };

  const data: NormalizedCountryWrite = {
    code,
    name,
    nameTr: str(r.nameTr),
    currencyCode: str(r.currencyCode, 'USD').toUpperCase() || 'USD',
    corporateTaxPct: numOrNull(r.corporateTaxPct),
    royaltyPct: numOrNull(r.royaltyPct),
    inflationPct: numOrNull(r.inflationPct),
    discountRateRecommendation: numOrNull(r.discountRateRecommendation),
    dieselPriceUsdPerLiter: numOrNull(r.dieselPriceUsdPerLiter),
    electricityCostUsdPerKwh: numOrNull(r.electricityCostUsdPerKwh),
    waterCostUsdPerM3: numOrNull(r.waterCostUsdPerM3),
    laborCostIndex: numOrNull(r.laborCostIndex),
    exchangeRateToUsd: numOrNull(r.exchangeRateToUsd),
    environmentalCostIndex: numOrNull(r.environmentalCostIndex),
    infrastructureRating: numOrNull(r.infrastructureRating),
    miningInvestmentRisk: normalizeRisk(r.miningInvestmentRisk),
    esgDifficulty: normalizeRisk(r.esgDifficulty),
    typicalPermittingYears: numOrNull(r.typicalPermittingYears),
    typicalRehabilitationCostUsdPerHa: numOrNull(r.typicalRehabilitationCostUsdPerHa),
    politicalRisk: normalizeRisk(r.politicalRisk),
    notes: str(r.notes),
    searchAliases: str(r.searchAliases),
    isActive: bool(r.isActive, true),
    sortOrder: numOrNull(r.sortOrder) ?? 0,
  };

  return { data };
}

export function toCountryCatalogPrismaData(
  data: NormalizedCountryWrite
): CountryCatalogWriteInput & { code: string; name: string } {
  return { ...data };
}
