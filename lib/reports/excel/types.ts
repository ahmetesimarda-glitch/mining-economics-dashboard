import type { MonteCarloResult, SensitivityPoint } from '@/lib/calculations';
import type { TornadoBar } from '@/lib/reports/shared/tornado';
import type { DepreciationRow } from '@/lib/calculations';
import type { FuelAnalysisItem } from '@/lib/calculations';

export interface ExcelWorkbookInput {
  project: Record<string, unknown>;
  cashFlows: Record<string, unknown>[];
  equipments: Record<string, unknown>[];
  personnels: Record<string, unknown>[];
  byProducts: Record<string, unknown>[];
  capexItems: Record<string, unknown>[];
  opexItems: Record<string, unknown>[];
  sensitivity: Record<string, SensitivityPoint[]>;
  monteCarlo: MonteCarloResult | null;
  tornado: TornadoBar[];
  depreciation: DepreciationRow[];
  fuelAnalysis: FuelAnalysisItem[];
}

export function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function str(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export function sheetName(name: string): string {
  return name.replace(/[\\/*?:\[\]]/g, '').slice(0, 31);
}
