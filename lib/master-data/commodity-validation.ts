import type { CommodityCatalogWriteInput } from './commodity-types';

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

export function slugifyCommodityCode(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^[0-9]+/, '')
    .slice(0, 48);
}

export interface NormalizedCommodityWrite {
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
}

export function normalizeCommodityCatalogInput(
  body: unknown,
  opts?: { requireName?: boolean }
): { data: NormalizedCommodityWrite; error?: undefined } | { data?: undefined; error: string } {
  const r = asRecord(body);
  const name = str(r.name);
  if (opts?.requireName !== false && !name) {
    return { error: 'Commodity name is required' };
  }

  const codeRaw = str(r.code) || slugifyCommodityCode(name);
  if (!codeRaw) {
    return { error: 'Commodity code is required' };
  }

  const risk = str(r.environmentalRisk, 'medium').toLowerCase();
  const environmentalRisk = ['low', 'medium', 'high'].includes(risk) ? risk : 'medium';

  const data: NormalizedCommodityWrite = {
    code: codeRaw,
    name,
    nameTr: str(r.nameTr),
    symbol: str(r.symbol),
    unit: str(r.unit, 't') || 't',
    typicalSellingUnit: str(r.typicalSellingUnit, 'USD/t') || 'USD/t',
    typicalPriceUsd: numOrNull(r.typicalPriceUsd),
    priceCurrency: str(r.priceCurrency, 'USD') || 'USD',
    gradeMin: numOrNull(r.gradeMin),
    gradeMax: numOrNull(r.gradeMax),
    gradeUnit: str(r.gradeUnit, '%') || '%',
    recoveryMinPct: numOrNull(r.recoveryMinPct),
    recoveryMaxPct: numOrNull(r.recoveryMaxPct),
    densityTPerM3: numOrNull(r.densityTPerM3),
    typicalProcessingMethod: str(r.typicalProcessingMethod),
    typicalMiningMethods: str(r.typicalMiningMethods, 'openPit') || 'openPit',
    typicalMineLifeYears: numOrNull(r.typicalMineLifeYears),
    refiningCostUsdPerT: numOrNull(r.refiningCostUsdPerT),
    smeltingCostUsdPerT: numOrNull(r.smeltingCostUsdPerT),
    payabilityPct: numOrNull(r.payabilityPct),
    transportationCostUsdPerT: numOrNull(r.transportationCostUsdPerT),
    royaltyDefaultPct: numOrNull(r.royaltyDefaultPct),
    environmentalRisk,
    colorHex: str(r.colorHex, '#64748b') || '#64748b',
    iconKey: str(r.iconKey, 'gem') || 'gem',
    notes: str(r.notes),
    searchAliases: str(r.searchAliases),
    isActive: bool(r.isActive, true),
    sortOrder: numOrNull(r.sortOrder) ?? 0,
  };

  return { data };
}

export function toCommodityCatalogPrismaData(data: NormalizedCommodityWrite): CommodityCatalogWriteInput & {
  code: string;
  name: string;
} {
  return { ...data };
}
